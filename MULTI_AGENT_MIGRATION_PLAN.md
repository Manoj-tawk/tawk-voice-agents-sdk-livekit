# Multi-Agent Customer Service Migration Plan
## From OpenAI Realtime API to LiveKit Agents Framework

---

## Executive Summary

**Current System**: 14-agent customer service system built with OpenAI Realtime API
**Target System**: LiveKit Agents framework with agent handoffs (workflows)
**Timeline**: 2-3 weeks implementation + 1 week testing
**Complexity**: High (multi-agent coordination, state management, authentication flow)

---

## 📊 Current Architecture Analysis

### Agent Inventory
1. **authenticationAgent** - Entry point, identity verification, routing
2. **homeAgent** - Home & garden products
3. **booksAgent** - Books & media
4. **electronicsAgent** - Electronics & tech
5. **fashionAgent** - Fashion & beauty
6. **orderTrackingAgent** - Order status & logistics
7. **returnsAgent** - Returns & exchanges
8. **salesAgent** - Product search & recommendations
9. **promotionsAgent** - Deals & promotions
10. **personalizationAgent** - Personalized recommendations
11. **sellerManagementAgent** - Seller operations
12. **securityAgent** - Security & fraud prevention
13. **advancedFeaturesAgent** - Advanced capabilities
14. **simulatedHumanAgent** - Human handoff simulation

### Key Features
- ✅ **Agent Handoffs**: Any agent can transfer to any other agent
- ✅ **Detailed Tools**: 5-10 tools per specialized agent
- ✅ **State Management**: Conversation states with transitions
- ✅ **Authentication Flow**: Multi-step identity verification
- ✅ **Disclosure Reading**: Mandatory promotional disclosure
- ✅ **OpenAI Realtime API**: Speech-to-speech with low latency

---

## 🎯 Migration Strategy

### Phase 1: Foundation (Week 1)
**Goal**: Set up core architecture and primary agent

#### 1.1 Core Infrastructure
```typescript
// File: packages/backend/src/agents/types.ts
// Shared types for all agents

export interface CustomerContext {
  customerId?: string;
  phoneNumber?: string;
  firstName?: string;
  dateOfBirth?: string;
  addressVerified: boolean;
  authenticatedAt?: Date;
  currentIntent?: string;
  orderHistory?: OrderInfo[];
  preferences?: UserPreferences;
}

export interface AgentTransferData {
  from: string;
  to: string;
  context: CustomerContext;
  reason: string;
  timestamp: Date;
}

export interface OrderInfo {
  orderId: string;
  status: string;
  items: ProductItem[];
  total: number;
}
```

#### 1.2 Authentication Agent (Primary Entry Point)
```typescript
// File: packages/backend/src/agents/authenticationAgent.ts

import { voice, llm } from '@livekit/agents';
import { z } from 'zod';
import type { CustomerContext } from './types';

export class AuthenticationAgent extends voice.Agent {
  private customerContext: CustomerContext = {
    addressVerified: false,
  };

  constructor() {
    super({
      instructions: `
You are the initial contact agent for TAWK.TO Marketplace.

# Your Role
1. Warm greeting and establish rapport
2. Collect customer name (first name only)
3. Verify identity through multi-step authentication:
   - Phone number (repeat back digit-by-digit)
   - Date of birth (confirm format)
   - Last 4 digits of SSN or credit card (confirm type)
   - Street address (confirm details)
4. Read FULL disclosure verbatim (promotional offer)
5. Route to appropriate specialist agent

# Conversation Flow
[State 1] Greeting → [State 2] Get Name → [State 3] Phone → 
[State 4] DOB → [State 5] SSN/CC → [State 6] Address → 
[State 7] Disclosure → [State 8] Route

# Critical Rules
- ALWAYS repeat sensitive info back character-by-character
- NEVER proceed to next step until confirmed
- MUST complete entire auth flow before transferring (except human agent)
- Read disclosure at FASTER pace but COMPLETE - no summaries
- Remember customer's original intent for routing

# Tone
Professional, warm, patient. Use natural fillers ("um", "let's see").
      `,
      tools: {
        authenticateUser: llm.tool({
          description: 'Verify user identity with phone, DOB, and last 4 digits',
          parameters: z.object({
            phoneNumber: z.string().describe('Phone number in format (111) 222-3333'),
            dateOfBirth: z.string().describe('Date of birth in YYYY-MM-DD format'),
            last4Digits: z.string().describe('Last 4 digits of SSN or credit card'),
            last4Type: z.enum(['ssn', 'credit_card']).describe('Type of last 4 digits'),
          }),
          execute: async ({ phoneNumber, dateOfBirth, last4Digits, last4Type }) => {
            // TODO: Replace with actual auth API
            this.customerContext.phoneNumber = phoneNumber;
            this.customerContext.dateOfBirth = dateOfBirth;
            this.customerContext.authenticatedAt = new Date();
            
            return {
              success: true,
              customerId: `CUST${Date.now()}`,
              message: 'Authentication successful',
            };
          },
        }),

        saveAddress: llm.tool({
          description: 'Save or update customer address after confirmation',
          parameters: z.object({
            phoneNumber: z.string(),
            street: z.string().describe('Street address'),
            city: z.string(),
            state: z.string(),
            postalCode: z.string(),
          }),
          execute: async ({ phoneNumber, street, city, state, postalCode }) => {
            // TODO: Replace with actual address API
            this.customerContext.addressVerified = true;
            
            return {
              success: true,
              message: 'Address saved successfully',
            };
          },
        }),

        logOfferResponse: llm.tool({
          description: 'Log customer response to promotional disclosure',
          parameters: z.object({
            phoneNumber: z.string(),
            offerId: z.string().describe('Offer ID (e.g., a-592)'),
            response: z.enum(['ACCEPTED', 'DECLINED', 'REMIND_LATER']),
          }),
          execute: async ({ phoneNumber, offerId, response }) => {
            // TODO: Replace with actual offer tracking API
            return {
              success: true,
              response,
              message: `Offer ${response.toLowerCase()}`,
            };
          },
        }),
      },
    });
  }

  // Override handoff methods to pass customer context
  async onHandoff(targetAgent: string, reason: string) {
    // Package customer context for next agent
    return {
      context: this.customerContext,
      reason,
      timestamp: new Date(),
    };
  }
}
```

### Phase 2: Category Agents (Week 1-2)
**Goal**: Implement specialized product category agents

#### 2.1 Agent Structure Pattern
Each category agent follows this template:

```typescript
// File: packages/backend/src/agents/categoryAgent.template.ts

import { voice, llm } from '@livekit/agents';
import { z } from 'zod';

export class CategoryAgentBase extends voice.Agent {
  constructor(
    agentName: string,
    instructions: string,
    tools: Record<string, any>,
  ) {
    super({
      instructions: `
${instructions}

# Universal Guidelines
- Keep responses brief: 1-2 sentences max
- Before calling any tool, say: "Hold on, let me check that"
- After tool results, immediately summarize in plain language
- Spell out numbers, dates, prices verbally
- No markdown, JSON, or technical jargon in responses

# Tool Usage Pattern
1. Acknowledge request
2. Say transition phrase ("Let me look that up")
3. Call tool
4. Summarize result conversationally
5. Ask clarifying question if needed

# When to Transfer
- Customer asks about different product category → Transfer to appropriate agent
- Order tracking needed → Transfer to orderTrackingAgent
- Return/refund request → Transfer to returnsAgent
- General shopping → Transfer to salesAgent
- Security concern → Transfer to securityAgent
- Request human → Transfer to humanAgent
      `,
      tools,
    });
  }
}

// Example: Home Agent
export class HomeAgent extends CategoryAgentBase {
  constructor() {
    super(
      'homeAgent',
      `You are a home and garden expert at TAWK.TO Marketplace. 
      Help with space planning, furniture sizing, appliance specs, decor coordination.`,
      {
        getProductDimensions: llm.tool({
          description: 'Get detailed dimensions and space requirements for home products',
          parameters: z.object({
            itemId: z.string().describe('Product ID'),
            roomType: z.enum([
              'living_room', 'bedroom', 'kitchen', 'dining_room',
              'bathroom', 'office', 'outdoor'
            ]).optional(),
          }),
          execute: async ({ itemId, roomType }) => {
            // Mock data - replace with actual product API
            const dimensions = {
              'HOME003': {
                name: 'IKEA MALM Bed Frame',
                dimensions: { length: '79 1/8"', width: '55 1/8"', height: '15"' },
                clearanceNeeded: 'Allow 24" on sides for bedding changes',
                assembly: 'Required (approximately 2 hours)',
                weightCapacity: '550 lbs',
                roomFitAdvice: 'Ideal for bedrooms 10x10 feet or larger',
              },
            };
            return dimensions[itemId] || { error: 'Product not found' };
          },
        }),
        
        // Add more home-specific tools...
      },
    );
  }
}
```

#### 2.2 Category Agents to Implement

**Electronics Agent**
- Tools: `searchTech`, `compareSpecs`, `getCompatibility`, `checkStock`

**Fashion Agent**
- Tools: `getSizingGuide`, `checkAvailability`, `getStyleRecommendations`, `findSimilarItems`

**Books Agent**
- Tools: `searchBooks`, `getBookDetails`, `findSimilarBooks`, `checkFormats`

---

### Phase 3: Service Agents (Week 2)
**Goal**: Implement transactional service agents

#### 3.1 Order Tracking Agent
```typescript
// File: packages/backend/src/agents/orderTrackingAgent.ts

export class OrderTrackingAgent extends voice.Agent {
  constructor() {
    super({
      instructions: `
You are an order tracking and logistics specialist at TAWK.TO Marketplace.

# Your Expertise
- Real-time order tracking
- Delivery updates and ETAs
- Shipping carrier coordination
- Delivery issue resolution
- Order modifications (pre-shipment)

# Response Style
- Brief updates: "Your order shipped yesterday, arrives Tuesday"
- Always say "Hold on, checking now" before tool calls
- Provide tracking numbers verbally (spell if asked)
- Proactive: Suggest solutions before customer asks

# Common Scenarios
1. Track order → Use trackOrder tool
2. Delivery issue → Use reportDeliveryIssue tool
3. Modify delivery → Use modifyDelivery tool
4. Shipping updates → Use getShippingUpdates tool
      `,
      tools: {
        trackOrder: llm.tool({
          description: 'Get real-time tracking for customer orders',
          parameters: z.object({
            orderNumber: z.string(),
            phoneNumber: z.string().describe('For verification'),
          }),
          execute: async ({ orderNumber, phoneNumber }) => {
            // Mock tracking data
            return {
              orderNumber,
              status: 'In Transit',
              trackingNumber: 'UPS1Z9E49370398230776',
              carrier: 'UPS',
              estimatedDelivery: '2024-12-28',
              currentLocation: 'Memphis, TN Distribution Center',
              trackingHistory: [
                { date: '2024-12-26 09:00', status: 'Order Processed' },
                { date: '2024-12-26 14:30', status: 'Picked Up' },
                { date: '2024-12-27 08:20', status: 'In Transit' },
              ],
            };
          },
        }),

        modifyDelivery: llm.tool({
          description: 'Modify delivery address, instructions, or schedule',
          parameters: z.object({
            orderNumber: z.string(),
            modificationType: z.enum([
              'address_change',
              'delivery_instructions',
              'reschedule',
              'hold_at_location',
            ]),
            newDetails: z.string(),
          }),
          execute: async ({ orderNumber, modificationType, newDetails }) => {
            const fees = {
              address_change: 5.99,
              delivery_instructions: 0,
              reschedule: 2.99,
              hold_at_location: 0,
            };

            return {
              orderNumber,
              modificationType,
              status: 'modification_requested',
              fee: fees[modificationType],
              processingTime: '1-2 hours',
              confirmation: `Modification request submitted: ${newDetails}`,
            };
          },
        }),

        reportDeliveryIssue: llm.tool({
          description: 'Report delivery problems',
          parameters: z.object({
            orderNumber: z.string(),
            issueType: z.enum([
              'damaged_package',
              'missing_items',
              'wrong_address',
              'never_received',
              'stolen_package',
            ]),
            description: z.string(),
            photoEvidence: z.boolean().optional(),
          }),
          execute: async ({ orderNumber, issueType, description, photoEvidence }) => {
            const resolutions = {
              damaged_package: {
                action: 'Immediate replacement or full refund',
                timeline: '24-48 hours',
              },
              missing_items: {
                action: 'Investigation with carrier, replacement if confirmed',
                timeline: '3-5 business days',
              },
              never_received: {
                action: 'Carrier investigation, replacement or refund',
                timeline: '5-7 business days',
              },
            };

            return {
              orderNumber,
              caseNumber: `DEL${Date.now().toString().slice(-8)}`,
              resolution: resolutions[issueType] || {
                action: 'Manual review required',
                timeline: '3-5 business days',
              },
              immediateAction: photoEvidence
                ? 'Photo evidence will expedite resolution'
                : 'Proceeding with standard investigation',
            };
          },
        }),
      },
    });
  }
}
```

#### 3.2 Returns Agent
```typescript
// Similar pattern with tools:
// - initiateReturn
// - checkReturnEligibility
// - schedulePickup
// - processRefund
// - trackReturnStatus
```

#### 3.3 Sales Agent (General Product Search)
```typescript
// Tools:
// - searchProducts
// - compareProducts
// - getProductDetails
// - checkAvailability
// - addToCart
// - applyPromotion
```

---

### Phase 4: Agent Handoff System (Week 2-3)
**Goal**: Implement LiveKit-native agent handoffs

#### 4.1 Handoff Architecture

LiveKit Agents 1.0 supports **agent handoffs** (workflows) as a first-class feature.

```typescript
// File: packages/backend/src/agents/handoffCoordinator.ts

import { voice } from '@livekit/agents';
import type { CustomerContext, AgentTransferData } from './types';

// All agents registry
export const AGENTS = {
  authentication: AuthenticationAgent,
  home: HomeAgent,
  books: BooksAgent,
  electronics: ElectronicsAgent,
  fashion: FashionAgent,
  orderTracking: OrderTrackingAgent,
  returns: ReturnsAgent,
  sales: SalesAgent,
  promotions: PromotionsAgent,
  personalization: PersonalizationAgent,
  security: SecurityAgent,
  human: HumanHandoffAgent,
} as const;

export type AgentName = keyof typeof AGENTS;

// Handoff coordinator manages transitions
export class HandoffCoordinator {
  private currentAgent: voice.Agent;
  private customerContext: CustomerContext;
  private transferHistory: AgentTransferData[] = [];

  constructor(initialAgent: voice.Agent, context: CustomerContext) {
    this.currentAgent = initialAgent;
    this.customerContext = context;
  }

  async transferTo(
    targetAgentName: AgentName,
    reason: string,
  ): Promise<voice.Agent> {
    const TransferredAgentClass = AGENTS[targetAgentName];
    const newAgent = new TransferredAgentClass();

    // Log transfer
    this.transferHistory.push({
      from: this.currentAgent.constructor.name,
      to: targetAgentName,
      context: { ...this.customerContext },
      reason,
      timestamp: new Date(),
    });

    // Update chat context with transfer info
    newAgent.updateChatCtx((ctx) => {
      ctx.addMessage({
        role: 'system',
        content: `
You are now taking over from ${this.currentAgent.constructor.name}.

Customer Context:
- Name: ${this.customerContext.firstName || 'Unknown'}
- Authenticated: ${this.customerContext.authenticatedAt ? 'Yes' : 'No'}
- Phone: ${this.customerContext.phoneNumber || 'Not provided'}
- Transfer Reason: ${reason}

Previous conversation history has been preserved. Continue the conversation
naturally, acknowledging the transfer briefly if appropriate.
        `,
      });
    });

    this.currentAgent = newAgent;
    return newAgent;
  }

  getContext(): CustomerContext {
    return this.customerContext;
  }

  updateContext(updates: Partial<CustomerContext>) {
    this.customerContext = { ...this.customerContext, ...updates };
  }
}
```

#### 4.2 Handoff Tool (Available to All Agents)
```typescript
// File: packages/backend/src/agents/tools/handoffTool.ts

import { llm } from '@livekit/agents';
import { z } from 'zod';
import type { HandoffCoordinator, AgentName } from '../handoffCoordinator';

export const createHandoffTool = (coordinator: HandoffCoordinator) => {
  return llm.tool({
    description: `Transfer the customer to a specialized agent when their request is outside your domain.

Available agents:
- authentication: Identity verification, initial greeting
- home: Home & garden products (furniture, appliances, decor)
- books: Books & media
- electronics: Electronics & tech gadgets
- fashion: Fashion & beauty products
- orderTracking: Order status, shipping, delivery
- returns: Returns, refunds, exchanges
- sales: General product search, recommendations
- promotions: Deals, discounts, promotional offers
- personalization: Personalized recommendations
- security: Security concerns, fraud prevention
- human: Transfer to human agent

IMPORTANT: Only transfer if you genuinely cannot help with their request.`,
    parameters: z.object({
      targetAgent: z.enum([
        'authentication',
        'home',
        'books',
        'electronics',
        'fashion',
        'orderTracking',
        'returns',
        'sales',
        'promotions',
        'personalization',
        'security',
        'human',
      ] as const),
      reason: z.string().describe('Brief reason for transfer (internal use)'),
      customerMessage: z
        .string()
        .optional()
        .describe('Optional message to customer about transfer'),
    }),
    execute: async ({ targetAgent, reason, customerMessage }) => {
      // Perform the handoff
      await coordinator.transferTo(targetAgent as AgentName, reason);

      return {
        success: true,
        transferredTo: targetAgent,
        message:
          customerMessage ||
          `Transferring you to our ${targetAgent} specialist who can better assist you.`,
      };
    },
  });
};
```

#### 4.3 Integration in Agent Entry Point
```typescript
// File: packages/backend/src/agent.ts (main entry)

import { defineAgent, voice, type JobContext } from '@livekit/agents';
import { AuthenticationAgent } from './agents/authenticationAgent';
import { HandoffCoordinator } from './agents/handoffCoordinator';
import { createHandoffTool } from './agents/tools/handoffTool';

export default defineAgent({
  entry: async (ctx: JobContext) => {
    // Initialize customer context
    const customerContext = {
      addressVerified: false,
    };

    // Start with authentication agent
    const authAgent = new AuthenticationAgent();
    
    // Create handoff coordinator
    const coordinator = new HandoffCoordinator(authAgent, customerContext);

    // Add handoff tool to all agents dynamically
    const handoffTool = createHandoffTool(coordinator);
    
    // Inject handoff tool into auth agent
    authAgent.tools = {
      ...authAgent.tools,
      transferAgent: handoffTool,
    };

    // Create session
    const session = new voice.AgentSession({
      stt: new deepgram.STT({ model: 'nova-3', language: 'en', smartFormat: true }),
      llm: new openai.LLM({ model: 'gpt-4o-mini', temperature: 0.7 }),
      tts: new elevenlabs.TTS({
        voice: { id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alice', category: 'premade' },
        modelID: 'eleven_turbo_v2_5',
      }),
      turnDetection: new livekit.turnDetector.MultilingualModel(),
      vad: ctx.proc.userData.vad,
      voiceOptions: { preemptiveGeneration: true },
    });

    // Start session with authentication agent
    await session.start({
      agent: authAgent,
      room: ctx.room,
      inputOptions: { noiseCancellation: BackgroundVoiceCancellation() },
    });

    // Handle agent transitions
    session.on(voice.AgentSessionEventTypes.AgentStateChanged, async (ev) => {
      // Monitor for handoff completions and update UI/logging
      console.log(`Agent state: ${ev.oldState} → ${ev.newState}`);
    });
  },
});
```

---

### Phase 5: Advanced Features (Week 3)
**Goal**: Implement advanced capabilities

#### 5.1 Promotions & Personalization
```typescript
// PromotionsAgent with tools for:
// - getCurrentPromotions
// - applyPromoCode
// - checkEligibility
// - calculateDiscount

// PersonalizationAgent with tools for:
// - getRecommendations (based on history)
// - updatePreferences
// - trackBehavior
// - suggestProducts
```

#### 5.2 Security & Fraud Prevention
```typescript
// SecurityAgent with tools for:
// - flagSuspiciousActivity
// - verifyTransaction
// - reportFraud
// - lockAccount
// - resetPassword
```

---

## 🔧 Technical Implementation Details

### File Structure
```
packages/backend/src/
├── agent.ts                    # Main entry point
├── agents/
│   ├── types.ts                # Shared types
│   ├── authenticationAgent.ts  # Primary entry agent
│   ├── categoryAgent.base.ts   # Base class for category agents
│   ├── homeAgent.ts
│   ├── booksAgent.ts
│   ├── electronicsAgent.ts
│   ├── fashionAgent.ts
│   ├── orderTrackingAgent.ts
│   ├── returnsAgent.ts
│   ├── salesAgent.ts
│   ├── promotionsAgent.ts
│   ├── personalizationAgent.ts
│   ├── securityAgent.ts
│   ├── humanHandoffAgent.ts
│   ├── handoffCoordinator.ts   # Manages agent transitions
│   └── tools/
│       ├── handoffTool.ts      # Universal handoff tool
│       ├── authTools.ts        # Authentication tools
│       ├── productTools.ts     # Product search/info
│       ├── orderTools.ts       # Order management
│       └── customerTools.ts    # Customer data
├── services/
│   ├── authService.ts          # Real auth API integration
│   ├── productService.ts       # Product database API
│   ├── orderService.ts         # Order management API
│   └── customerService.ts      # Customer data API
└── utils/
    ├── formatting.ts           # Response formatting helpers
    └── validation.ts           # Input validation
```

### Configuration
```typescript
// File: packages/backend/src/config.ts

export const AGENT_CONFIG = {
  // STT Configuration
  stt: {
    provider: 'deepgram',
    model: 'nova-3',
    language: 'en',
    smartFormat: true,
  },

  // LLM Configuration
  llm: {
    provider: 'openai',
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 150, // Enforce brevity
  },

  // TTS Configuration
  tts: {
    provider: 'elevenlabs',
    model: 'eleven_turbo_v2_5',
    voice: {
      id: 'Xb7hH8MSUJpSbSDYk0k2',
      name: 'Alice',
      category: 'premade',
    },
  },

  // Voice options
  voice: {
    preemptiveGeneration: true,
    minEndpointingDelay: 0.5,
  },

  // Agent-specific settings
  agents: {
    authentication: {
      requiresFullFlow: true,
      disclosureRequired: true,
    },
    orderTracking: {
      requiresAuth: true,
    },
    sales: {
      requiresAuth: false, // Can browse without auth
    },
  },
};
```

---

## 📋 Migration Checklist

### Week 1: Foundation
- [ ] Set up project structure (`agents/`, `services/`, `utils/`)
- [ ] Create shared types (`types.ts`)
- [ ] Implement `AuthenticationAgent` with full auth flow
- [ ] Implement 3 tools: `authenticateUser`, `saveAddress`, `logOfferResponse`
- [ ] Test authentication flow end-to-end
- [ ] Create `HandoffCoordinator` class
- [ ] Implement universal `handoffTool`

### Week 2: Agents & Handoffs
- [ ] Implement `HomeAgent` with 4 tools
- [ ] Implement `ElectronicsAgent` with 4 tools
- [ ] Implement `FashionAgent` with 4 tools
- [ ] Implement `BooksAgent` with 3 tools
- [ ] Implement `OrderTrackingAgent` with 5 tools
- [ ] Implement `ReturnsAgent` with 4 tools
- [ ] Implement `SalesAgent` with 6 tools
- [ ] Test handoffs between all agents
- [ ] Verify customer context preservation

### Week 3: Advanced Features & Polish
- [ ] Implement `PromotionsAgent`
- [ ] Implement `PersonalizationAgent`
- [ ] Implement `SecurityAgent`
- [ ] Implement `HumanHandoffAgent`
- [ ] Connect to real backend APIs (replace mocks)
- [ ] Add comprehensive logging
- [ ] Implement error handling & fallbacks
- [ ] Performance optimization

### Week 4: Testing & Deployment
- [ ] Unit tests for all tools
- [ ] Integration tests for handoffs
- [ ] End-to-end conversation tests
- [ ] Load testing (multiple concurrent calls)
- [ ] Security audit
- [ ] Documentation
- [ ] Staging deployment
- [ ] Production deployment

---

## ⚠️ Key Differences: OpenAI Realtime vs LiveKit

| Feature | OpenAI Realtime | LiveKit Agents |
|---------|----------------|----------------|
| **Agent Class** | `RealtimeAgent` | `voice.Agent` |
| **Tool Definition** | `tool()` from `@openai/agents/realtime` | `llm.tool()` with Zod schemas |
| **Handoffs** | `handoffs: []` array | `transferAgent` tool + coordinator |
| **Voice** | Realtime API (speech-to-speech) | STT → LLM → TTS pipeline |
| **State Management** | Built into RealtimeAgent | Manual via `updateChatCtx()` |
| **Parameters** | `parameters` object | Zod schema validation |
| **Context Preservation** | Automatic | Manual via coordinator |

---

## 🚀 Quick Start Implementation

### Step 1: Install Dependencies
```bash
cd packages/backend
pnpm add zod  # Already installed
# All LiveKit packages already installed
```

### Step 2: Create First Agent
```bash
mkdir -p src/agents src/agents/tools src/services src/utils
touch src/agents/types.ts
touch src/agents/authenticationAgent.ts
touch src/agents/handoffCoordinator.ts
touch src/agents/tools/handoffTool.ts
```

### Step 3: Implement Authentication Agent
Copy the `AuthenticationAgent` code from **Phase 1.2** above.

### Step 4: Update Main Entry Point
Copy the entry point code from **Phase 4.3** above.

### Step 5: Test
```bash
pnpm start
# Test with voice call to verify auth flow
```

---

## 📊 Expected Performance

| Metric | Target | Notes |
|--------|--------|-------|
| **First Response Time** | < 1 second | With preemptive generation |
| **Agent Handoff Latency** | < 500ms | Context transfer + new agent init |
| **Tool Execution Time** | < 300ms | For most database queries |
| **Authentication Flow** | 2-3 minutes | Full identity verification |
| **Concurrent Sessions** | 100+ | Per backend instance |

---

## 🎯 Success Criteria

1. ✅ **All 14 agents implemented** with appropriate tools
2. ✅ **Seamless handoffs** between any agent pair
3. ✅ **Customer context preserved** across transfers
4. ✅ **Authentication flow** matches original system
5. ✅ **Response brevity** maintained (1-2 sentences)
6. ✅ **Low latency** (< 1s first response)
7. ✅ **Tool usage** with conversational transitions
8. ✅ **Production-ready** error handling

---

## 📞 Next Steps

1. **Review this plan** with the team
2. **Approve architecture** and timeline
3. **Start Phase 1** implementation
4. **Set up weekly reviews** to track progress
5. **Prepare backend APIs** for production integration

---

## 🤝 Support & Resources

- **LiveKit Docs**: https://docs.livekit.io/agents
- **Agents Workflows**: https://docs.livekit.io/agents/build/workflows
- **LiveKit MCP Server**: Already installed for quick docs access
- **GitHub Issues**: For LiveKit-specific questions
- **This Plan**: Reference throughout implementation

---

**Ready to start? Begin with Phase 1.2 (Authentication Agent)!** 🚀

