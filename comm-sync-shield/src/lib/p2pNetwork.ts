import { BlockchainMessage } from './blockchain';
import { VectorClock } from './vectorClock';

export interface NetworkNode {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'degraded';
  lastSeen: number;
  messageCount: number;
  encryptionKey: string;
  position: { x: number; y: number };
  role: 'command' | 'field' | 'relay';
}

export interface NetworkMessage {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: number;
  vectorClock: VectorClock;
  encrypted: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  messageType: 'text' | 'status' | 'command' | 'alert';
  deliveryStatus: 'pending' | 'delivered' | 'failed' | 'acknowledged';
}

export interface NetworkEvent {
  id: string;
  type: 'node_join' | 'node_leave' | 'message_sent' | 'message_received' | 'sync_started' | 'sync_completed' | 'network_partition' | 'network_heal';
  nodeId: string;
  timestamp: number;
  data?: any;
}

export class P2PNetworkSimulator {
  private nodes: Map<string, NetworkNode> = new Map();
  private messages: NetworkMessage[] = [];
  private events: NetworkEvent[] = [];
  private networkPartitions: Set<string> = new Set();
  private serverOnline = true;

  constructor() {
    this.initializeDefaultNodes();
    this.startNetworkSimulation();
  }

  private initializeDefaultNodes(): void {
    const defaultNodes: NetworkNode[] = [
      {
        id: 'CMD-001',
        name: 'Command Center Alpha',
        status: 'online',
        lastSeen: Date.now(),
        messageCount: 0,
        encryptionKey: 'RSA-PUB-CMD001',
        position: { x: 50, y: 20 },
        role: 'command'
      },
      {
        id: 'FIELD-001',
        name: 'Field Unit Bravo',
        status: 'online', 
        lastSeen: Date.now(),
        messageCount: 0,
        encryptionKey: 'RSA-PUB-FIELD001',
        position: { x: 20, y: 60 },
        role: 'field'
      },
      {
        id: 'FIELD-002',
        name: 'Field Unit Charlie',
        status: 'online',
        lastSeen: Date.now(),
        messageCount: 0,
        encryptionKey: 'RSA-PUB-FIELD002',
        position: { x: 80, y: 70 },
        role: 'field'
      },
      {
        id: 'RELAY-001',
        name: 'Relay Station Delta',
        status: 'online',
        lastSeen: Date.now(),
        messageCount: 0,
        encryptionKey: 'RSA-PUB-RELAY001',
        position: { x: 50, y: 80 },
        role: 'relay'
      }
    ];

    defaultNodes.forEach(node => this.nodes.set(node.id, node));
  }

  private startNetworkSimulation(): void {
    // Simulate random network events
    setInterval(() => {
      this.simulateRandomNetworkEvent();
    }, 5000);

    // Update node status
    setInterval(() => {
      this.updateNodeStatuses();
    }, 2000);
  }

  private simulateRandomNetworkEvent(): void {
    const events = [
      () => this.simulateNodeDrop(),
      () => this.simulateNodeReconnect(), 
      () => this.simulateNetworkPartition(),
      () => this.simulateServerFailure()
    ];

    if (Math.random() < 0.3) { // 30% chance of event
      const event = events[Math.floor(Math.random() * events.length)];
      event();
    }
  }

  private simulateNodeDrop(): void {
    const onlineNodes = Array.from(this.nodes.values()).filter(n => n.status === 'online');
    if (onlineNodes.length > 1) {
      const node = onlineNodes[Math.floor(Math.random() * onlineNodes.length)];
      node.status = 'offline';
      this.addEvent('node_leave', node.id);
    }
  }

  private simulateNodeReconnect(): void {
    const offlineNodes = Array.from(this.nodes.values()).filter(n => n.status === 'offline');
    if (offlineNodes.length > 0) {
      const node = offlineNodes[Math.floor(Math.random() * offlineNodes.length)];
      node.status = 'online';
      node.lastSeen = Date.now();
      this.addEvent('node_join', node.id);
    }
  }

  private simulateNetworkPartition(): void {
    const onlineNodes = Array.from(this.nodes.values()).filter(n => n.status === 'online');
    if (onlineNodes.length > 2) {
      const nodeToPartition = onlineNodes[Math.floor(Math.random() * onlineNodes.length)];
      this.networkPartitions.add(nodeToPartition.id);
      nodeToPartition.status = 'degraded';
      this.addEvent('network_partition', nodeToPartition.id);
    }
  }

  private simulateServerFailure(): void {
    if (this.serverOnline && Math.random() < 0.1) { // 10% chance
      this.serverOnline = false;
      this.addEvent('node_leave', 'SERVER');
      
      // Automatically restore after 10-30 seconds
      setTimeout(() => {
        this.serverOnline = true;
        this.addEvent('node_join', 'SERVER');
      }, 10000 + Math.random() * 20000);
    }
  }

  private updateNodeStatuses(): void {
    this.nodes.forEach(node => {
      if (node.status === 'online') {
        node.lastSeen = Date.now();
      }
    });
  }

  private addEvent(type: NetworkEvent['type'], nodeId: string, data?: any): void {
    const event: NetworkEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      nodeId,
      timestamp: Date.now(),
      data
    };
    
    this.events.unshift(event);
    if (this.events.length > 100) {
      this.events = this.events.slice(0, 100);
    }
  }

  sendMessage(message: Omit<NetworkMessage, 'id' | 'deliveryStatus'>): string {
    const fullMessage: NetworkMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      deliveryStatus: 'pending'
    };

    this.messages.unshift(fullMessage);
    this.addEvent('message_sent', message.from, { to: message.to, content: message.content });

    // Update sender's message count
    const sender = this.nodes.get(message.from);
    if (sender) {
      sender.messageCount++;
    }

    // Simulate delivery with network conditions
    setTimeout(() => {
      this.simulateMessageDelivery(fullMessage);
    }, this.calculateDeliveryDelay(message.from, message.to));

    return fullMessage.id;
  }

  private calculateDeliveryDelay(from: string, to: string): number {
    const sender = this.nodes.get(from);
    const recipient = this.nodes.get(to);
    
    let delay = 100; // Base delay

    if (!this.serverOnline) delay += 2000; // Server down
    if (sender?.status === 'degraded') delay += 1000;
    if (recipient?.status === 'offline') delay += 5000;
    if (this.networkPartitions.has(from) || this.networkPartitions.has(to)) delay += 3000;

    return delay + Math.random() * 1000; // Add jitter
  }

  private simulateMessageDelivery(message: NetworkMessage): void {
    const recipient = this.nodes.get(message.to);
    
    if (recipient?.status === 'offline') {
      message.deliveryStatus = 'failed';
    } else {
      message.deliveryStatus = 'delivered';
      this.addEvent('message_received', message.to, { from: message.from });
      
      // Simulate acknowledgment
      setTimeout(() => {
        message.deliveryStatus = 'acknowledged';
      }, 500 + Math.random() * 1000);
    }
  }

  getNodes(): NetworkNode[] {
    return Array.from(this.nodes.values());
  }

  getNode(nodeId: string): NetworkNode | undefined {
    return this.nodes.get(nodeId);
  }

  getMessages(limit = 50): NetworkMessage[] {
    return this.messages.slice(0, limit);
  }

  getEvents(limit = 20): NetworkEvent[] {
    return this.events.slice(0, limit);
  }

  getNetworkStats() {
    const nodes = this.getNodes();
    const totalNodes = nodes.length;
    const onlineNodes = nodes.filter(n => n.status === 'online').length;
    const degradedNodes = nodes.filter(n => n.status === 'degraded').length;
    const offlineNodes = nodes.filter(n => n.status === 'offline').length;

    return {
      totalNodes,
      onlineNodes,
      degradedNodes,
      offlineNodes,
      serverOnline: this.serverOnline,
      totalMessages: this.messages.length,
      networkPartitions: this.networkPartitions.size,
      networkHealth: onlineNodes / totalNodes
    };
  }

  // Manual controls for demonstration
  toggleServerStatus(): void {
    this.serverOnline = !this.serverOnline;
    this.addEvent(this.serverOnline ? 'node_join' : 'node_leave', 'SERVER');
  }

  forceNodeOffline(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.status = 'offline';
      this.addEvent('node_leave', nodeId);
    }
  }

  forceNodeOnline(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.status = 'online';
      node.lastSeen = Date.now();
      this.networkPartitions.delete(nodeId);
      this.addEvent('node_join', nodeId);
    }
  }
}