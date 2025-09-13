import { generateMessageHash, signMessage, verifySignature } from './crypto';

export interface BlockchainMessage {
  id: string;
  content: string;
  senderId: string;
  recipientId: string;
  timestamp: number;
  vectorClock: Record<string, number>;
  hash: string;
  signature: string;
  encrypted: boolean;
}

export interface Block {
  index: number;
  timestamp: number;
  messages: BlockchainMessage[];
  previousHash: string;
  hash: string;
  merkleRoot: string;
  minedBy: string;
}

export class MilitaryBlockchain {
  private chain: Block[] = [];
  private pendingMessages: BlockchainMessage[] = [];
  private nodeId: string;

  constructor(nodeId: string) {
    this.nodeId = nodeId;
    this.createGenesisBlock();
  }

  private createGenesisBlock(): void {
    const genesisBlock: Block = {
      index: 0,
      timestamp: Date.now(),
      messages: [],
      previousHash: '0',
      hash: '0000000000000000',
      merkleRoot: '0000000000000000',
      minedBy: 'GENESIS'
    };
    
    this.chain.push(genesisBlock);
  }

  addMessage(message: BlockchainMessage): void {
    // Validate message integrity
    const expectedHash = generateMessageHash(message.content, message.timestamp, message.senderId);
    if (message.hash !== expectedHash) {
      throw new Error('Message hash validation failed');
    }

    this.pendingMessages.push(message);
    
    // Auto-mine when we have messages (in real system, this would be more sophisticated)
    if (this.pendingMessages.length >= 1) {
      this.mineBlock();
    }
  }

  private mineBlock(): void {
    const block: Block = {
      index: this.chain.length,
      timestamp: Date.now(),
      messages: [...this.pendingMessages],
      previousHash: this.getLatestBlock().hash,
      hash: '',
      merkleRoot: this.calculateMerkleRoot(this.pendingMessages),
      minedBy: this.nodeId
    };

    block.hash = this.calculateBlockHash(block);
    this.chain.push(block);
    this.pendingMessages = [];
  }

  private calculateBlockHash(block: Block): string {
    const blockString = `${block.index}${block.timestamp}${block.previousHash}${block.merkleRoot}`;
    return generateMessageHash(blockString, block.timestamp, block.minedBy);
  }

  private calculateMerkleRoot(messages: BlockchainMessage[]): string {
    if (messages.length === 0) return '0000000000000000';
    
    const hashes = messages.map(msg => msg.hash);
    return this.buildMerkleTree(hashes);
  }

  private buildMerkleTree(hashes: string[]): string {
    if (hashes.length === 1) return hashes[0];
    
    const newLevel: string[] = [];
    for (let i = 0; i < hashes.length; i += 2) {
      const left = hashes[i];
      const right = hashes[i + 1] || left;
      newLevel.push(generateMessageHash(left + right, Date.now(), 'MERKLE'));
    }
    
    return this.buildMerkleTree(newLevel);
  }

  getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  getChain(): Block[] {
    return [...this.chain];
  }

  getAllMessages(): BlockchainMessage[] {
    return this.chain.flatMap(block => block.messages);
  }

  validateChain(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // Validate block hash
      if (currentBlock.hash !== this.calculateBlockHash(currentBlock)) {
        return false;
      }

      // Validate chain linkage  
      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }

      // Validate merkle root
      if (currentBlock.merkleRoot !== this.calculateMerkleRoot(currentBlock.messages)) {
        return false;
      }
    }

    return true;
  }

  // Sync with another blockchain (conflict resolution)
  syncChain(otherChain: Block[]): boolean {
    if (otherChain.length > this.chain.length && this.validateExternalChain(otherChain)) {
      this.chain = [...otherChain];
      return true;
    }
    return false;
  }

  private validateExternalChain(chain: Block[]): boolean {
    // Simple validation - in production would be more sophisticated
    return chain.length > 0 && chain[0].previousHash === '0';
  }

  getStats() {
    return {
      blocks: this.chain.length,
      messages: this.getAllMessages().length,
      pending: this.pendingMessages.length,
      isValid: this.validateChain()
    };
  }
}