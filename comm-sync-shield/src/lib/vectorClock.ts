// Vector Clock implementation for message ordering in distributed military system

export type VectorClock = Record<string, number>;

export class VectorClockManager {
  private nodeId: string;
  private clock: VectorClock;

  constructor(nodeId: string, knownNodes: string[] = []) {
    this.nodeId = nodeId;
    this.clock = {};
    
    // Initialize clock for all known nodes
    [nodeId, ...knownNodes].forEach(node => {
      this.clock[node] = 0;
    });
  }

  // Increment local clock when sending a message
  tick(): VectorClock {
    this.clock[this.nodeId] = (this.clock[this.nodeId] || 0) + 1;
    return this.getClock();
  }

  // Update clock when receiving a message
  update(receivedClock: VectorClock): VectorClock {
    // Ensure we have entries for all nodes in received clock
    Object.keys(receivedClock).forEach(nodeId => {
      if (!(nodeId in this.clock)) {
        this.clock[nodeId] = 0;
      }
    });

    // Update our clock to be element-wise maximum
    Object.keys(this.clock).forEach(nodeId => {
      if (nodeId === this.nodeId) {
        // Increment our own counter
        this.clock[nodeId] = Math.max(
          this.clock[nodeId],
          receivedClock[nodeId] || 0
        ) + 1;
      } else {
        // Take maximum for other nodes
        this.clock[nodeId] = Math.max(
          this.clock[nodeId] || 0,
          receivedClock[nodeId] || 0
        );
      }
    });

    return this.getClock();
  }

  getClock(): VectorClock {
    return { ...this.clock };
  }

  // Compare two vector clocks to determine ordering
  static compare(clock1: VectorClock, clock2: VectorClock): 'before' | 'after' | 'concurrent' {
    const nodes1 = Object.keys(clock1);
    const nodes2 = Object.keys(clock2);
    const allNodes = new Set([...nodes1, ...nodes2]);

    let clock1Before = false;
    let clock2Before = false;

    for (const node of allNodes) {
      const val1 = clock1[node] || 0;
      const val2 = clock2[node] || 0;

      if (val1 < val2) {
        clock1Before = true;
      } else if (val1 > val2) {
        clock2Before = true;
      }
    }

    if (clock1Before && !clock2Before) {
      return 'before';
    } else if (clock2Before && !clock1Before) {
      return 'after';
    } else {
      return 'concurrent';
    }
  }

  // Check if event A happened before event B
  static happenedBefore(clockA: VectorClock, clockB: VectorClock): boolean {
    return this.compare(clockA, clockB) === 'before';
  }

  // Merge vector clocks from different sources for conflict resolution
  static merge(clocks: VectorClock[]): VectorClock {
    const merged: VectorClock = {};
    
    clocks.forEach(clock => {
      Object.keys(clock).forEach(nodeId => {
        merged[nodeId] = Math.max(merged[nodeId] || 0, clock[nodeId] || 0);
      });
    });

    return merged;
  }

  // Sort messages by vector clock ordering
  static sortMessages<T extends { vectorClock: VectorClock; timestamp: number }>(
    messages: T[]
  ): T[] {
    return messages.sort((a, b) => {
      const comparison = this.compare(a.vectorClock, b.vectorClock);
      
      if (comparison === 'before') return -1;
      if (comparison === 'after') return 1;
      
      // For concurrent events, fall back to timestamp
      return a.timestamp - b.timestamp;
    });
  }

  // Add a new node to the vector clock
  addNode(nodeId: string): void {
    if (!(nodeId in this.clock)) {
      this.clock[nodeId] = 0;
    }
  }

  // Remove a node from the vector clock (when node goes offline)
  removeNode(nodeId: string): void {
    if (nodeId !== this.nodeId) {
      delete this.clock[nodeId];
    }
  }

  // Get visualization data for the clock
  getVisualizationData() {
    return Object.entries(this.clock).map(([nodeId, value]) => ({
      nodeId,
      value,
      isSelf: nodeId === this.nodeId
    }));
  }
}