import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MilitaryBlockchain, Block, BlockchainMessage } from '@/lib/blockchain';
import { Database, Shield, Hash, Clock, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';

interface BlockchainLedgerProps {
  blockchain: MilitaryBlockchain;
}

export function BlockchainLedger({ blockchain }: BlockchainLedgerProps) {
  const [chain, setChain] = useState<Block[]>([]);
  const [allMessages, setAllMessages] = useState<BlockchainMessage[]>([]);
  const [stats, setStats] = useState(blockchain.getStats());
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [showEncrypted, setShowEncrypted] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setChain(blockchain.getChain());
      setAllMessages(blockchain.getAllMessages());
      setStats(blockchain.getStats());
    }, 1000);

    return () => clearInterval(interval);
  }, [blockchain]);

  const formatHash = (hash: string) => {
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getBlockColor = (index: number) => {
    if (index === 0) return 'border-muted'; // Genesis block
    return 'border-blockchain';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Blockchain Statistics */}
      <Card className="lg:col-span-1 border-blockchain/20 bg-gradient-command p-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-blockchain" />
            <h3 className="font-semibold text-blockchain">Blockchain Stats</h3>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-3 bg-muted/20">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blockchain">{stats.blocks}</div>
                  <div className="text-xs text-muted-foreground">BLOCKS</div>
                </div>
              </Card>
              <Card className="p-3 bg-muted/20">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{stats.messages}</div>
                  <div className="text-xs text-muted-foreground">MESSAGES</div>
                </div>
              </Card>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/20 rounded">
              <span className="text-sm text-muted-foreground">Chain Integrity</span>
              <div className="flex items-center space-x-2">
                {stats.isValid ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                )}
                <Badge variant={stats.isValid ? 'default' : 'destructive'}>
                  {stats.isValid ? 'VALID' : 'CORRUPTED'}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/20 rounded">
              <span className="text-sm text-muted-foreground">Pending Messages</span>
              <Badge variant="secondary">{stats.pending}</Badge>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEncrypted(!showEncrypted)}
              className="w-full"
            >
              {showEncrypted ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Hide Encrypted
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Show Encrypted
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Blockchain Visualization */}
      <Card className="lg:col-span-2 border-blockchain/20 bg-gradient-command p-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Hash className="h-5 w-5 text-blockchain" />
            <h3 className="font-semibold text-blockchain">Blockchain Ledger</h3>
          </div>

          {/* Block Chain */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {chain.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Blockchain is initializing...</p>
              </div>
            ) : (
              chain.slice().reverse().map((block, index) => (
                <Card 
                  key={block.index}
                  className={`p-4 cursor-pointer transition-all hover:bg-muted/20 ${
                    getBlockColor(block.index)
                  } ${selectedBlock?.index === block.index ? 'ring-2 ring-blockchain' : ''}`}
                  onClick={() => setSelectedBlock(selectedBlock?.index === block.index ? null : block)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blockchain/20 rounded flex items-center justify-center">
                          <span className="text-xs font-bold text-blockchain">#{block.index}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold">Block {block.index}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {formatTime(block.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {block.messages.length} msgs
                      </Badge>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {formatHash(block.hash)}
                      </Badge>
                    </div>
                  </div>

                  {/* Block Details (when selected) */}
                  {selectedBlock?.index === block.index && (
                    <div className="mt-4 pt-4 border-t border-border space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-muted-foreground">Previous Hash:</span>
                          <p className="font-mono text-blockchain break-all">
                            {formatHash(block.previousHash)}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Merkle Root:</span>
                          <p className="font-mono text-blockchain break-all">
                            {formatHash(block.merkleRoot)}
                          </p>
                        </div>
                      </div>

                      <div>
                        <span className="text-muted-foreground text-xs">Mined by:</span>
                        <p className="font-mono text-sm">{block.minedBy}</p>
                      </div>

                      {/* Messages in this block */}
                      {block.messages.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-muted-foreground">Messages in Block:</h4>
                          {block.messages.map((message) => (
                            <Card key={message.id} className="p-3 bg-muted/30">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center space-x-2">
                                    <Badge variant="outline" className="text-xs">
                                      {message.senderId} → {message.recipientId}
                                    </Badge>
                                    {message.encrypted && (
                                      <Badge variant="outline" className="text-xs">
                                        <Shield className="mr-1 h-3 w-3" />
                                        ENCRYPTED
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm font-mono bg-background/50 p-2 rounded">
                                    {message.encrypted && !showEncrypted 
                                      ? '*** ENCRYPTED MESSAGE ***' 
                                      : message.content}
                                  </p>
                                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>Hash: {formatHash(message.hash)}</span>
                                    <span>Sig: {formatHash(message.signature)}</span>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>

          {/* Verification Status */}
          <div className="flex items-center justify-between p-3 bg-muted/20 rounded">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-blockchain" />
              <span className="text-sm font-medium">Blockchain Verification</span>
            </div>
            <div className="flex items-center space-x-2">
              {stats.isValid ? (
                <CheckCircle className="h-4 w-4 text-success" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-destructive" />
              )}
              <span className="text-sm font-mono">
                {stats.isValid ? 'ALL BLOCKS VERIFIED' : 'VERIFICATION FAILED'}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}