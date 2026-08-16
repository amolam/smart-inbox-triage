export interface DemoBatchPreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  text: string;
}

export const DEMO_PRESETS: DemoBatchPreset[] = [
  {
    id: 'standard',
    name: '10 AM Morning Operational Rush',
    badge: 'Recommended Demo',
    description: 'Standard mixed morning batch with breakdowns, escalations, vague requests, and routine updates.',
    text: `Truck MH04 AB1234 broke down near Pune highway. Driver says vehicle cannot move and today's 11 AM delivery is still pending.

Customer is upset because order 8292 is already delayed by 2 hours and is asking for an immediate update.

Can we reschedule tomorrow's pickup to the afternoon around 3 PM instead of 10 AM?

Order 8292 delivered successfully. Signed POD received from warehouse supervisor.

Sir, there is a problem with the delivery.

Vendor hasn't delivered the packaging material required for today's dispatch at Hub 4.

Driver Ramesh reported heavy waterlogging on Eastern Express Highway. Expecting a 45-minute delay on Route 7.

Client Apex Retail rejected 4 pallets from shipment SHP-4091 claiming carton box water damage.

Daily temperature sensor check for ColdChain Van 12 passed. 4.2 degrees Celsius throughout transit.

Driver reached customer gate at 9:45 AM, waiting for unloading bay clearance.`,
  },
  {
    id: 'high-urgency',
    name: 'Critical Incident & Escalation Surge',
    badge: 'High Incident',
    description: 'Multiple high-impact operational blockers, driver emergencies, and key customer escalations.',
    text: `URGENT: Truck KA01 MJ8819 met with a minor accident near Tumkur toll. Driver is safe but front axle is jammed. High-value electronics cargo locked inside.

Enterprise client Titan Industries threatening to cancel annual contract if 5 truckloads for their automotive plant aren't dispatched by noon today.

Customs clearance at Nhava Sheva port is stalled due to mismatch in commercial invoice number on Container MSKU-88219.

Driver Ajay's phone has been completely unreachable for 3 hours on the Solapur long-haul route. Last GPS ping showed vehicle stationary on highway shoulder.

Refrigeration unit failure alarm triggered on Reefer Truck MH12 QW9902 carrying temperature-sensitive vaccine vials ($45k cargo).

Warehouse dock 3 forklift battery exploded. Loading operations suspended until fire safety clearance.

Payment received for invoice INV-2024-889. Account marked clear.`,
  },
  {
    id: 'vague-mix',
    name: 'Ambiguous & Needs-Review Test Case',
    badge: 'Safeguard Test',
    description: 'Demonstrates handling of vague messages without hallucinating facts or manufacturing certainty.',
    text: `Sir, there is an issue with the truck. Please check urgently.

Customer called. They are angry.

Delivery issue at Bangalore.

Truck MH04 AB1234 broke down near Pune. Driver says vehicle cannot move and today's 11 AM delivery is still pending.

Please call me back immediately when you see this.

Need update on the order.

Vendor hasn't delivered the packaging material required for today's dispatch.

Something went wrong with the shipment.

Can we reschedule tomorrow's pickup?`,
  },
];
