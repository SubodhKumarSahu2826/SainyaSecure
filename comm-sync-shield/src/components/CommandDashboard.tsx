import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageInterface } from './MessageInterface';
import { NetworkTopology } from './NetworkTopology';
import { BlockchainLedger } from './BlockchainLedger';
import { SystemStatus } from './SystemStatus';
import { P2PNetworkSimulator } from '@/lib/p2pNetwork';
import { MilitaryBlockchain } from '@/lib/blockchain';
import { VectorClockManager } from '@/lib/vectorClock';
import { Shield, Radio, Database, Users, AlertTriangle, CheckCircle } from 'lucide-react';

export function CommandDashboard() {
  const [currentNodeId] = useState('CMD-001');
  const [network] = useState(() => new P2PNetworkSimulator());
  const [blockchain] = useState(() => new MilitaryBlockchain(currentNodeId));
  const [vectorClock] = useState(() => new VectorClockManager(currentNodeId, ['FIELD-001', 'FIELD-002', 'RELAY-001']));
  const [networkStats, setNetworkStats] = useState(network.getNetworkStats());
  const [activeTab, setActiveTab] = useState<'messages' | 'network' | 'blockchain' | 'status'>('messages');

  useEffect(() => {
    const interval = setInterval(() => {
      setNetworkStats(network.getNetworkStats());
    }, 1000);

    return () => clearInterval(interval);
  }, [network]);

  const getStatusColor = (health: number) => {
    if (health >= 0.8) return 'success';
    if (health >= 0.5) return 'warning';
    return 'destructive';
  };

  const tabs = [
    { id: 'messages', label: 'Tactical Messages', icon: Radio },
    { id: 'network', label: 'Network Topology', icon: Users },
    { id: 'blockchain', label: 'Blockchain Ledger', icon: Database },
    { id: 'status', label: 'System Status', icon: Shield }
  ];

  return (
    <div className="min-h-screen bg-background tactical-grid p-4">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-primary">MILITARY COMMS SYSTEM</h1>
                <p className="text-sm text-muted-foreground font-mono">Node: {currentNodeId} | CLASSIFIED</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {networkStats.serverOnline ? (
                <>
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span className="text-sm font-mono text-success">SERVER ONLINE</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <span className="text-sm font-mono text-destructive">SERVER OFFLINE</span>
                </>
              )}
            </div>
            
            <Badge variant={getStatusColor(networkStats.networkHealth) as any} className="font-mono">
              NETWORK {Math.round(networkStats.networkHealth * 100)}%
            </Badge>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-primary/20 bg-gradient-command p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Nodes</p>
                <p className="text-2xl font-bold text-primary">{networkStats.onlineNodes}/{networkStats.totalNodes}</p>
              </div>
              <Users className="h-8 w-8 text-primary/60" />
            </div>
          </Card>

          <Card className="border-encrypted/20 bg-gradient-command p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Messages</p>
                <p className="text-2xl font-bold text-encrypted">{networkStats.totalMessages}</p>
              </div>
              <Radio className="h-8 w-8 text-encrypted/60" />
            </div>
          </Card>

          <Card className="border-blockchain/20 bg-gradient-command p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Blockchain</p>
                <p className="text-2xl font-bold text-blockchain">{blockchain.getStats().blocks} Blocks</p>
              </div>
              <Database className="h-8 w-8 text-blockchain/60" />
            </div>
          </Card>

          <Card className="border-warning/20 bg-gradient-command p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Partitions</p>
                <p className="text-2xl font-bold text-warning">{networkStats.networkPartitions}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-warning/60" />
            </div>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-muted/50 p-1 rounded-lg">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                onClick={() => setActiveTab(tab.id as any)}
                className="flex-1 font-mono"
              >
                <Icon className="mr-2 h-4 w-4" />
                {tab.label}
              </Button>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="min-h-[600px]">
          {activeTab === 'messages' && (
            <MessageInterface 
              network={network}
              blockchain={blockchain}
              vectorClock={vectorClock}
              currentNodeId={currentNodeId}
            />
          )}
          
          {activeTab === 'network' && (
            <NetworkTopology 
              network={network}
              currentNodeId={currentNodeId}
            />
          )}
          
          {activeTab === 'blockchain' && (
            <BlockchainLedger 
              blockchain={blockchain}
            />
          )}
          
          {activeTab === 'status' && (
            <SystemStatus 
              network={network}
              blockchain={blockchain}
              vectorClock={vectorClock}
              currentNodeId={currentNodeId}
            />
          )}
        </div>
      </div>
    </div>
  );
}