import {
  type JobContext,
  type JobProcess,
  ServerOptions,
  Task,
  cli,
  defineAgent,
  llm,
  log,
  metrics,
  voice,
  getJobContext,
} from "@livekit/agents";
import * as deepgram from "@livekit/agents-plugin-deepgram";
import * as elevenlabs from "@livekit/agents-plugin-elevenlabs";
import * as livekit from "@livekit/agents-plugin-livekit";
import * as openai from "@livekit/agents-plugin-openai";
import * as silero from "@livekit/agents-plugin-silero";
import { BackgroundVoiceCancellation } from "@livekit/noise-cancellation-node";
import { RoomServiceClient } from 'livekit-server-sdk';
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { z } from "zod";

dotenv.config({ path: ".env.local" });

// ==================== Marketplace AI Agent ====================
// tawk.to marketplace assistant with order tracking, shipping, and product search

// Hangup function for phone calls
const hangUpCall = async () => {
  const jobContext = getJobContext();
  if (!jobContext) {
    return;
  }

  const roomServiceClient = new RoomServiceClient(
    process.env.LIVEKIT_URL!,
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!
  );

  if (jobContext.room.name) {
    await roomServiceClient.deleteRoom(jobContext.room.name);
  }
};

class MarketplaceAgent extends voice.Agent {
  override async onEnter(): Promise<void> {
    // Check if this is a phone call (SIP participant)
    const sipParticipants = Array.from(this.room.remoteParticipants.values())
      .filter((p: any) => p.kind === 'sip');
    
    const isPhoneCall = sipParticipants.length > 0;

    if (isPhoneCall) {
      // Phone greeting - more formal
      this.session.generateReply({
        instructions:
          'Say "Thank you for calling tawk.to marketplace. I\'m your AI shopping assistant. How may I help you today?"',
      });
    } else {
      // Web/app greeting - existing
      this.session.generateReply({
        instructions:
          'Say "Welcome to TAWK.To Marketplace!" and then briefly introduce yourself as their shopping assistant who can help them find and purchase products.',
      });
    }
  }

  constructor() {
    super({
      instructions: `You are a friendly tawk.to marketplace assistant who helps customers shop for products - from browsing to checkout!

# Your Role
Guide customers through the complete shopping journey:
1. **Product Discovery** - Help find products
2. **Product Details** - Share specs, reviews, prices
3. **Recommendations** - Suggest similar or better options
4. **Add to Cart** - Add items they want
5. **Checkout** - Complete the purchase with shipping

# Personality
- Warm, helpful, conversational (like a personal shopper)
- Enthusiastic about products: "Great choice! That's one of our bestsellers!"
- Guide naturally: "Let me find that for you", "I'll add that to your cart"
- Use natural fillers: "um", "let's see", "hold on"

# Response Style
- Keep responses friendly and brief (2-3 sentences)
- Be encouraging: "Perfect!", "Excellent pick!", "That's in stock!"
- Acknowledge actions: "Added to cart!", "Let me check shipping for you"

# Complete Shopping Flow

**Step 1: Search Products**
User: "I want to buy an iPhone"
You: "Great! Let me see what iPhones we have available for you."
[Call searchProducts]
You: "Perfect! I found the iPhone 15 Pro Max for nine ninety nine dollars, and the iPhone 15 for seven ninety nine. Which one interests you?"

**Step 2: Show Details**
User: "Tell me about the Pro Max"
You: "Let me pull up the details for you."
[Call getProductDetails]
You: "The iPhone 15 Pro Max has a six point seven inch display, A17 Pro chip, and an amazing camera system. It's highly rated at four point eight stars with over twelve thousand reviews. Would you like to add it to your cart?"

**Step 3: Add to Cart**
User: "Yes, add it"
You: "Perfect! Adding the iPhone 15 Pro Max to your cart now."
[Call addToCart]
You: "Done! It's in your cart. Would you like to proceed to checkout or keep shopping?"

**Step 4: Checkout**
User: "Let's checkout"
You: "Excellent! I'll need your zip code to show you shipping options."
User: "One zero zero zero one"
You: "Great, let me get shipping options for you."
[Call getShippingOptions]
You: "We have free standard shipping in five to seven days, expedited for nine ninety nine in two to three days, or overnight for twenty four ninety nine. Which works best for you?"

**Step 5: Complete Order**
User: "Standard is fine"
You: "Perfect! Let me complete your order with standard shipping."
[Call checkout]
You: "Wonderful! Your order is confirmed. Order number is X-Y-Z-one-two-three-four. Your iPhone 15 Pro Max will arrive in five to seven business days. Is there anything else I can help you with?"

# Tool Usage - Always Say What You're Doing
- Before tools: "Let me check that", "I'll pull that up", "Looking now"
- After tools: Share results warmly and conversationally

# Voice Rules
- Plain text only (no markdown/JSON)
- Spell out: numbers, prices, dates
- "nine ninety nine dollars" not "$999"
- "five to seven days" not "5-7 days"

# Handling Questions
- For stock: "Yes, it's available! Ships from our warehouse"
- For comparisons: "Let me compare those for you"
- For recommendations: "Based on what you're looking for, I'd suggest..."

Remember: You're guiding them through a complete shopping experience - be helpful, warm, and efficient!`,
      tools: {
        // ===== E-COMMERCE TOOLS: Complete Shopping Flow =====

        // 1. SEARCH PRODUCTS
        searchProducts: llm.tool({
          description:
            "Search for products in the marketplace with filters. First step in shopping.",
          parameters: z.object({
            query: z
              .string()
              .describe("Product name or keywords (e.g., iPhone, laptop)"),
            category: z
              .enum([
                "electronics",
                "fashion",
                "home",
                "books",
                "sports",
                "any",
              ])
              .describe("Product category"),
            minPrice: z
              .number()
              .nullish()
              .describe("Minimum price filter (optional)"),
            maxPrice: z
              .number()
              .nullish()
              .describe("Maximum price filter (optional)"),
            sortBy: z
              .enum([
                "relevance",
                "price_low_high",
                "price_high_low",
                "rating",
                "bestseller",
              ])
              .nullish()
              .describe("Sort order (optional)"),
          }),
          execute: async (
            { query, category, minPrice, maxPrice, sortBy },
            { ctx },
          ) => {
            // Send a verbal status update if search takes longer than 500ms
            const speakStatusUpdate = async (controller: AbortController) => {
              await new Promise((resolve) => setTimeout(resolve, 500));
              if (!controller.signal.aborted) {
                ctx.session.generateReply({
                  instructions: `You are searching for products but it's taking a moment. Update the user briefly - keep it to 3-5 words like "Searching now" or "Looking that up".`,
                });
              }
            };

            const statusUpdateTask = Task.from(speakStatusUpdate);

            // Mock product database
            const allProducts = [
              {
                item_id: "ELEC001",
                name: "iPhone 15 Pro Max",
                brand: "Apple",
                price: 999,
                original_price: 1199,
                rating: 4.8,
                reviews: 12450,
                in_stock: true,
                category: "electronics",
              },
              {
                item_id: "ELEC002",
                name: "iPhone 15",
                brand: "Apple",
                price: 799,
                original_price: 899,
                rating: 4.7,
                reviews: 8230,
                in_stock: true,
                category: "electronics",
              },
              {
                item_id: "ELEC003",
                name: "Samsung Galaxy S24 Ultra",
                brand: "Samsung",
                price: 949,
                original_price: 1099,
                rating: 4.6,
                reviews: 6780,
                in_stock: true,
                category: "electronics",
              },
              {
                item_id: "ELEC004",
                name: "MacBook Pro 14-inch",
                brand: "Apple",
                price: 1799,
                original_price: 1999,
                rating: 4.9,
                reviews: 5670,
                in_stock: true,
                category: "electronics",
              },
              {
                item_id: "ELEC005",
                name: "AirPods Pro 2nd Gen",
                brand: "Apple",
                price: 199,
                original_price: 249,
                rating: 4.7,
                reviews: 18900,
                in_stock: true,
                category: "electronics",
              },
            ];

            let filtered = allProducts;

            // Filter by category
            if (category !== "any") {
              filtered = filtered.filter((p) => p.category === category);
            }

            // Filter by query
            const searchTerms = query.toLowerCase().split(" ");
            filtered = filtered.filter((p) =>
              searchTerms.some(
                (term) =>
                  p.name.toLowerCase().includes(term) ||
                  p.brand.toLowerCase().includes(term),
              ),
            );

            // Filter by price
            if (minPrice)
              filtered = filtered.filter((p) => p.price >= minPrice);
            if (maxPrice)
              filtered = filtered.filter((p) => p.price <= maxPrice);

            // Sort
            if (sortBy === "price_low_high")
              filtered.sort((a, b) => a.price - b.price);
            if (sortBy === "price_high_low")
              filtered.sort((a, b) => b.price - a.price);
            if (sortBy === "rating")
              filtered.sort((a, b) => b.rating - a.rating);
            if (sortBy === "bestseller")
              filtered.sort((a, b) => b.reviews - a.reviews);

            const result = {
              products: filtered.slice(0, 5), // Top 5 results
              total_found: filtered.length,
              search_query: query,
              category: category,
            };

            // Cancel status update if search completed before timeout
            statusUpdateTask.cancel();

            return result;
          },
        }),

        // 2. GET PRODUCT DETAILS
        getProductDetails: llm.tool({
          description:
            "Get detailed information about a specific product including specs, reviews, availability.",
          parameters: z.object({
            itemId: z.string().describe("Product ID from search results"),
          }),
          execute: async ({ itemId }, { ctx }) => {
            // Send a verbal status update if lookup takes longer than 500ms
            const speakStatusUpdate = async (controller: AbortController) => {
              await new Promise((resolve) => setTimeout(resolve, 500));
              if (!controller.signal.aborted) {
                ctx.session.generateReply({
                  instructions: `You are looking up product details but it's taking a moment. Update the user briefly - keep it to 3-5 words like "Getting details" or "One moment".`,
                });
              }
            };

            const statusUpdateTask = Task.from(speakStatusUpdate);

            const productDetails = {
              ELEC001: {
                item_id: "ELEC001",
                name: "iPhone 15 Pro Max",
                brand: "Apple",
                price: 999,
                original_price: 1199,
                discount_percent: 17,
                rating: 4.8,
                reviews: 12450,
                in_stock: true,
                stock_quantity: 145,
                description:
                  "6.7-inch Super Retina XDR display, A17 Pro chip, Pro camera system with 48MP main camera",
                features: [
                  "6.7-inch OLED display",
                  "A17 Pro chip",
                  "48MP triple camera",
                  "5G capable",
                  "Face ID",
                ],
                shipping:
                  "Free standard (5-7 days) or expedited ($9.99, 2-3 days)",
                warranty: "1 year Apple warranty included",
                seller: "TechWorld (98% positive)",
              },
              ELEC002: {
                item_id: "ELEC002",
                name: "iPhone 15",
                brand: "Apple",
                price: 799,
                original_price: 899,
                discount_percent: 11,
                rating: 4.7,
                reviews: 8230,
                in_stock: true,
                stock_quantity: 87,
                description:
                  "6.1-inch Super Retina XDR display, A16 Bionic chip, Advanced dual camera system",
                features: [
                  "6.1-inch OLED display",
                  "A16 Bionic chip",
                  "12MP dual camera",
                  "5G capable",
                  "Face ID",
                ],
                shipping:
                  "Free standard (5-7 days) or expedited ($9.99, 2-3 days)",
                warranty: "1 year Apple warranty included",
                seller: "TechWorld (98% positive)",
              },
            };

            const result = (productDetails as any)[itemId] || {
              error: "Product not found",
              item_id: itemId,
            };

            // Cancel status update if lookup completed before timeout
            statusUpdateTask.cancel();

            return result;
          },
        }),

        // 3. ADD TO CART
        addToCart: llm.tool({
          description: "Add a product to the customer's shopping cart.",
          parameters: z.object({
            itemId: z.string().describe("Product ID to add"),
            quantity: z
              .number()
              .default(1)
              .describe("Quantity to add (default: 1)"),
            variant: z
              .string()
              .nullish()
              .describe("Product variant (e.g., color, size) if applicable"),
          }),
          execute: async ({ itemId, quantity, variant }, { ctx }) => {
            // Send a verbal status update if add takes longer than 500ms
            const speakStatusUpdate = async (controller: AbortController) => {
              await new Promise((resolve) => setTimeout(resolve, 500));
              if (!controller.signal.aborted) {
                ctx.session.generateReply({
                  instructions: `You are adding items to cart but it's taking a moment. Update the user briefly - keep it to 3-5 words like "Adding now" or "One moment".`,
                });
              }
            };

            const statusUpdateTask = Task.from(speakStatusUpdate);

            const result = {
              success: true,
              item_id: itemId,
              quantity,
              variant: variant || "Default",
              cart_total_items: quantity + Math.floor(Math.random() * 3),
              cart_total_value: quantity * 999, // Simplified
              message: `Added ${quantity} item(s) to your cart!`,
            };

            // Cancel status update if add completed before timeout
            statusUpdateTask.cancel();

            return result;
          },
        }),

        // 4. GET SHIPPING OPTIONS
        getShippingOptions: llm.tool({
          description: "Get available shipping options and delivery estimates.",
          parameters: z.object({
            zipCode: z.string().describe("Delivery zip code"),
            itemIds: z.array(z.string()).describe("Item IDs in cart"),
          }),
          execute: async ({ zipCode, itemIds }, { ctx }) => {
            // Send a verbal status update if lookup takes longer than 500ms
            const speakStatusUpdate = async (controller: AbortController) => {
              await new Promise((resolve) => setTimeout(resolve, 500));
              if (!controller.signal.aborted) {
                ctx.session.generateReply({
                  instructions: `You are checking shipping options but it's taking a moment. Update the user briefly - keep it to 3-5 words like "Checking options" or "Looking that up".`,
                });
              }
            };

            const statusUpdateTask = Task.from(speakStatusUpdate);

            const result = {
              shipping_options: [
                {
                  type: "standard",
                  cost: 0,
                  delivery_days: "5-7",
                  description: "Free Standard Shipping",
                  estimated_arrival: new Date(
                    Date.now() + 6 * 24 * 60 * 60 * 1000,
                  ).toLocaleDateString(),
                },
                {
                  type: "expedited",
                  cost: 9.99,
                  delivery_days: "2-3",
                  description: "Expedited Shipping",
                  estimated_arrival: new Date(
                    Date.now() + 2.5 * 24 * 60 * 60 * 1000,
                  ).toLocaleDateString(),
                },
                {
                  type: "overnight",
                  cost: 24.99,
                  delivery_days: "1",
                  description: "Overnight Delivery",
                  estimated_arrival: new Date(
                    Date.now() + 1 * 24 * 60 * 60 * 1000,
                  ).toLocaleDateString(),
                },
              ],
              delivery_zip: zipCode,
              total_items: itemIds.length,
            };

            // Cancel status update if lookup completed before timeout
            statusUpdateTask.cancel();

            return result;
          },
        }),

        // 5. CHECKOUT & PLACE ORDER
        checkout: llm.tool({
          description:
            "Complete the purchase and place the order with selected shipping.",
          parameters: z.object({
            shippingType: z.enum(["standard", "expedited", "overnight"]),
            zipCode: z.string(),
            paymentMethod: z
              .enum(["credit_card", "paypal", "apple_pay"])
              .nullish()
              .default("credit_card"),
          }),
          execute: async (
            { shippingType, zipCode, paymentMethod },
            { ctx },
          ) => {
            // Send a verbal status update if checkout takes longer than 500ms
            const speakStatusUpdate = async (controller: AbortController) => {
              await new Promise((resolve) => setTimeout(resolve, 500));
              if (!controller.signal.aborted) {
                ctx.session.generateReply({
                  instructions: `You are processing the checkout but it's taking a moment. Update the user briefly - keep it to 3-5 words like "Processing now" or "One moment".`,
                });
              }
            };

            const statusUpdateTask = Task.from(speakStatusUpdate);

            const orderNumber = `ORD${Date.now().toString().slice(-8)}`;
            const shippingCosts = {
              standard: 0,
              expedited: 9.99,
              overnight: 24.99,
            };

            const result = {
              success: true,
              order_number: orderNumber,
              order_status: "Confirmed",
              shipping_method: shippingType,
              shipping_cost: shippingCosts[shippingType],
              estimated_delivery: new Date(
                Date.now() +
                  (shippingType === "overnight"
                    ? 1
                    : shippingType === "expedited"
                      ? 3
                      : 6) *
                    24 *
                    60 *
                    60 *
                    1000,
              ).toLocaleDateString(),
              payment_method: paymentMethod,
              confirmation_email: "Sent to customer email",
              tracking_available: "Within 24 hours",
              message: "Order placed successfully!",
            };

            // Cancel status update if checkout completed before timeout
            statusUpdateTask.cancel();

            return result;
          },
        }),

        // ===== ORIGINAL TOOLS: Order Tracking, Returns, etc. =====

        // Check order status by order ID
        checkOrderStatus: llm.tool({
          description: "Search for products in the marketplace",
          parameters: z.object({
            query: z.string().describe("The search query"),
            category: z.string().nullish().describe("Optional category filter"),
          }),
          execute: async ({ query, category }) => {
            // Mock product data - instant response
            const mockProducts = [
              {
                id: "1",
                name: `Premium ${query}`,
                price: 49.99,
                inStock: true,
                rating: 4.5,
              },
              {
                id: "2",
                name: `${query} Pro`,
                price: 79.99,
                inStock: true,
                rating: 4.8,
              },
              {
                id: "3",
                name: `${query} Lite`,
                price: 29.99,
                inStock: false,
                rating: 4.2,
              },
            ];

            return {
              query,
              category: category || "All",
              results: mockProducts,
              totalFound: mockProducts.length,
            };
          },
        }),

        // Check product availability and stock
        checkInventory: llm.tool({
          description: "Check if a product is in stock and available",
          parameters: z.object({
            productId: z.string().describe("The product ID to check"),
          }),
          execute: async ({ productId }) => {
            // Mock inventory check - instant response
            const inStock = Math.random() > 0.3;
            const quantity = inStock ? Math.floor(Math.random() * 100) + 1 : 0;

            return {
              productId,
              inStock,
              quantity,
              nextRestockDate: inStock
                ? null
                : new Date(
                    Date.now() + 7 * 24 * 60 * 60 * 1000,
                  ).toLocaleDateString(),
            };
          },
        }),

        // Process return or exchange
        processReturn: llm.tool({
          description: "Process a return or exchange request for an order",
          parameters: z.object({
            orderId: z.string().describe("The order ID for the return"),
            reason: z.string().describe("Reason for the return"),
          }),
          execute: async ({ orderId, reason }) => {
            // Mock return processing - instant response
            return {
              orderId,
              reason,
              returnId: `RET${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
              status: "Approved",
              refundAmount: Math.floor(Math.random() * 100) + 20,
              estimatedRefundDate: new Date(
                Date.now() + 5 * 24 * 60 * 60 * 1000,
              ).toLocaleDateString(),
            };
          },
        }),

        // PHONE CALL MANAGEMENT
        endCall: llm.tool({
          description: 'Call this when the customer says goodbye or wants to end the call. Always confirm before ending. ONLY use for PHONE calls.',
          parameters: z.object({
            reason: z.string().describe('Brief reason for ending call (e.g., "completed purchase", "no assistance needed")'),
          }),
          execute: async ({ reason }, { ctx }) => {
            // Inform customer
            await ctx.session.generateReply({
              instructions: `Say "Thank you for calling tawk.to marketplace. Have a great day! Goodbye!"`,
            });
            
            // Wait for speech to complete
            await new Promise((resolve) => setTimeout(resolve, 3000));
            
            // Hang up
            await hangUpCall();
            
            return `Call ended: ${reason}`;
          },
        }),
      },
    });
  }
}

export default defineAgent({
  prewarm: async (proc: JobProcess) => {
    proc.userData.vad = await silero.VAD.load();
  },
  entry: async (ctx: JobContext) => {
    // Create logger inside entry function (after logger is initialized by cli.runApp)
    const logger = log().child({ name: "marketplace-agent" });

    // Optimized pipeline: STT → LLM → TTS
    // Balanced for LOW LATENCY + HIGH QUALITY conversation
    // Strategy: Fast models + short instructions + smart caching

    const session = new voice.AgentSession({
      // Speech-to-text using Deepgram plugin - fastest streaming STT
      stt: new deepgram.STT({
        apiKey: process.env.DEEPGRAM_API_KEY!, // Explicitly pass API key for child processes
        model: "nova-3", // Fastest Deepgram model
        language: "en",
        smartFormat: true, // Auto-format numbers/dates
        interimResults: true, // Enable interim results for responsiveness
      }),

      // Large Language Model - optimized for speed + quality balance
      llm: new openai.LLM({
        apiKey: process.env.OPENAI_API_KEY!, // Explicitly pass API key for child processes
        model: "gpt-4o-mini", // 2-3x faster than gpt-4o, still high quality
        temperature: 0.7, // Balanced: conversational but consistent
      }),

      // Text-to-speech using ElevenLabs - fastest TTS
      tts: new elevenlabs.TTS({
        apiKey: process.env.ELEVENLABS_API_KEY!, // Explicitly pass API key for child processes
        voice: {
          id: "kPzsL2i3teMYv0FxEYQ6", // Custom voice from ElevenLabs library
          name: "Custom Voice",
          category: "premade",
        },
        modelID: "eleven_turbo_v2_5", // Lowest latency model
        streamingLatency: 1, // Optimize for speed (0-4, higher = lower latency)
      }),

      // Turn detection using multilingual model
      turnDetection: new livekit.turnDetector.MultilingualModel(),

      // VAD (Voice Activity Detection)
      vad: ctx.proc.userData.vad! as silero.VAD,

      // Voice options - optimized for low latency without compromising UX
      voiceOptions: {
        // CRITICAL: Generate response while user is still speaking
        preemptiveGeneration: true,

        // Balanced endpointing: fast but won't interrupt mid-sentence
        minEndpointingDelay: 0.6, // Sweet spot for natural conversation
      },
    });

    // Metrics collection, to measure pipeline performance
    const usageCollector = new metrics.UsageCollector();
    session.on(voice.AgentSessionEventTypes.MetricsCollected, (ev) => {
      metrics.logMetrics(ev.metrics);
      usageCollector.collect(ev.metrics);
    });

    const logUsage = async () => {
      const summary = usageCollector.getSummary();
      logger.info(`Usage: ${JSON.stringify(summary)}`);
    };

    ctx.addShutdownCallback(logUsage);

    // Start the session, which initializes the voice pipeline and warms up the models
    // session.start() automatically connects to the room if not already connected
    // Reference: https://docs.livekit.io/agents/start/voice-ai/
    await session.start({
      agent: new MarketplaceAgent(),
      room: ctx.room,
      inputOptions: {
        // Enhanced noise cancellation for better audio quality in customer calls
        noiseCancellation: BackgroundVoiceCancellation(),
      },
    });

    logger.info(
      "Marketplace agent started and ready for customer interactions",
    );
  },
});

// Use ServerOptions with agentName for explicit dispatch
// This is the tawk.to marketplace assistant agent
// Reference: https://docs.livekit.io/agents/server/agent-dispatch
cli.runApp(
  new ServerOptions({
    agent: fileURLToPath(import.meta.url),
    agentName: "Quinn_353", // Agent name - must match frontend RoomConfiguration
  }),
);
