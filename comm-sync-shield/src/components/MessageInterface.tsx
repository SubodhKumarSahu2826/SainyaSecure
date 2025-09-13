import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { P2PNetworkSimulator, NetworkMessage } from '@/lib/p2pNetwork';
import { MilitaryBlockchain, BlockchainMessage } from '@/lib/blockchain';
import { VectorClockManager } from '@/lib/vectorClock';
import { encryptMessage, generateMessageHash, signMessage, generateKeyPair } from '@/lib/crypto';
import { Send, Shield, Clock, AlertCircle, CheckCircle2, X } from 'lucide-react';

interface MessageInterfaceProps {
  network: P2PNetworkSimulator;
  blockchain: MilitaryBlockchain;
  vectorClock: VectorClockManager;
  currentNodeId: string;
}

export function MessageInterface({ network, blockchain, vectorClock, currentNodeId }: MessageInterfaceProps) {
  const [messages, setMessages] = useState<NetworkMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<string>('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [encryptEnabled, setEncryptEnabled] = useState(true);
  const [keyPair] = useState(() => generateKeyPair(currentNodeId));

  useEffect(() => {
    const interval = setInterval(() => {
      setMessages(network.getMessages(20));
    }, 1000);

    return () => clearInterval(interval);
  }, [network]);

  const nodes = network.getNodes().filter(node => node.id !== currentNodeId);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedRecipient) return;

    // Update vector clock
    const clock = vectorClock.tick();
    
    // Create network message
    const networkMessage: Omit<NetworkMessage, 'id' | 'deliveryStatus'> = {
      from: currentNodeId,
      to: selectedRecipient,
      content: newMessage,
      timestamp: Date.now(),
      vectorClock: clock,
      encrypted: encryptEnabled,
      priority,
      messageType: 'text'
    };

    // Send through network
    const messageId = network.sendMessage(networkMessage);

    // Add to blockchain
    const recipientNode = network.getNode(selectedRecipient);
    const encryptedContent = encryptEnabled && recipientNode 
      ? encryptMessage(newMessage, recipientNode.encryptionKey)
      : newMessage;

    const blockchainMessage: BlockchainMessage = {
      id: messageId,
      content: encryptedContent,
      senderId: currentNodeId,
      recipientId: selectedRecipient,
      timestamp: Date.now(),
      vectorClock: clock,
      hash: generateMessageHash(encryptedContent, Date.now(), currentNodeId),
      signature: signMessage(encryptedContent, keyPair.privateKey),
      encrypted: encryptEnabled
    };

    blockchain.addMessage(blockchainMessage);

    // Reset form
    setNewMessage('');
    setSelectedRecipient('');
  };

  const getStatusIcon = (status: NetworkMessage['deliveryStatus']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'delivered':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'acknowledged':
        return <CheckCircle2 className="h-4 w-4 text-primary" />;
      case 'failed':
        return <X className="h-4 w-4 text-destructive" />;
    }
  };

  const getPriorityColor = (priority: NetworkMessage['priority']) => {
    switch (priority) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'warning';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'muted';
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Message Composition */}
      <Card className="lg:col-span-1 border-primary/20 bg-gradient-command p-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Send className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-primary">Send Message</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Recipient</label>
              <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                <SelectTrigger className="bg-muted/50">
                  <SelectValue placeholder="Select recipient node" />
                </SelectTrigger>
                <SelectContent>
                  {nodes.map((node) => (
                    <SelectItem key={node.id} value={node.id}>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          node.status === 'online' ? 'bg-success' : 
                          node.status === 'degraded' ? 'bg-warning' : 'bg-destructive'
                        }`} />
                        <span>{node.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Priority</label>
              <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                <SelectTrigger className="bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="encrypt"
                checked={encryptEnabled}
                onChange={(e) => setEncryptEnabled(e.target.checked)}
                className="rounded border-border"
              />
              <label htmlFor="encrypt" className="text-sm text-muted-foreground flex items-center space-x-1">
                <Shield className="h-4 w-4" />
                <span>End-to-End Encryption</span>
              </label>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Message</label>
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Enter tactical message..."
                className="bg-muted/50"
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
            </div>

            <Button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || !selectedRecipient}
              className="w-full"
            >
              <Send className="mr-2 h-4 w-4" />
              Send Message
            </Button>
          </div>
        </div>
      </Card>

      {/* Message History */}
      <Card className="lg:col-span-2 border-primary/20 bg-gradient-command p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-primary">Message Log</h3>
            </div>
            <Badge variant="secondary" className="font-mono">
              {messages.length} Messages
            </Badge>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No messages in the tactical network</p>
              </div>
            ) : (
              messages.map((message) => (
                <Card 
                  key={message.id} 
                  className={`p-4 border-l-4 ${
                    message.from === currentNodeId 
                      ? 'border-l-primary bg-primary/5' 
                      : 'border-l-secondary bg-secondary/5'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant={getPriorityColor(message.priority) as any} className="text-xs">
                          {message.priority.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs font-mono">
                          {message.from} → {message.to}
                        </Badge>
                        {message.encrypted && (
                          <Badge variant="outline" className="text-xs">
                            <Shield className="mr-1 h-3 w-3" />
                            ENCRYPTED
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm font-mono bg-muted/30 p-2 rounded">
                        {message.content}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-mono">{formatTime(message.timestamp)}</span>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(message.deliveryStatus)}
                          <span>{message.deliveryStatus.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}