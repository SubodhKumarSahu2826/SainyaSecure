import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { P2PNetworkSimulator } from '@/lib/p2pNetwork';
import { MilitaryBlockchain } from '@/lib/blockchain';
import { VectorClockManager } from '@/lib/vectorClock';
import { 
  Shield, 
  Activity, 
  Clock, 
  Database, 
  Wifi, 
  AlertTriangle, 
  CheckCircle2,
  Server,
  Lock,
  Radio
} from 'lucide-react';

interface SystemStatusProps {
  network: P2PNetworkSimulator;
  blockchain: MilitaryBlockchain;
  vectorClock: VectorClockManager;
  currentNodeId: string;
}

export function SystemStatus({ network, blockchain, vectorClock, currentNodeId }: SystemStatusProps) {
  const [networkStats, setNetworkStats] = useState(network.getNetworkStats());
  const [blockchainStats, setBlockchainStats] = useState(blockchain.getStats());
  const [clockData, setClockData] = useState(vectorClock.getVisualizationData());
  const [systemMetrics, setSystemMetrics] = useState({
    uptime: Date.now(),
    messageLatency: 0,
    encryptionStrength: 98,
    consensusHealth: 95
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setNetworkStats(network.getNetworkStats());
      setBlockchainStats(blockchain.getStats());
      setClockData(vectorClock.getVisualizationData());
      
      // Simulate system metrics
      setSystemMetrics(prev => ({
        ...prev,
        messageLatency: Math.floor(Math.random() * 200) + 50,
        encryptionStrength: 96 + Math.floor(Math.random() * 4),
        consensusHealth: networkStats.networkHealth * 100
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [network, blockchain, vectorClock, networkStats.networkHealth]);

  const getUptime = () => {
    const uptimeMs = Date.now() - systemMetrics.uptime;
    const hours = Math.floor(uptimeMs / (1000 * 60 * 60));
    const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getHealthColor = (value: number) => {
    if (value >= 90) return 'text-success';
    if (value >= 70) return 'text-warning';
    return 'text-destructive';
  };

  const getHealthBadge = (value: number) => {
    if (value >= 90) return 'default';
    if (value >= 70) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* System Overview */}
      <Card className="border-primary/20 bg-gradient-command p-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-primary">System Overview</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 bg-muted/20">
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="h-4 w-4 text-success" />
                <span className="text-sm font-medium">System Status</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="text-sm text-success">OPERATIONAL</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Uptime: {getUptime()}
              </p>
            </Card>

            <Card className="p-4 bg-muted/20">
              <div className="flex items-center space-x-2 mb-2">
                <Server className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Node ID</span>
              </div>
              <p className="text-sm font-mono text-primary">{currentNodeId}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Command Node
              </p>
            </Card>
          </div>

          {/* Performance Metrics */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Network Health</span>
                <Badge variant={getHealthBadge(networkStats.networkHealth * 100) as any}>
                  {Math.round(networkStats.networkHealth * 100)}%
                </Badge>
              </div>
              <Progress value={networkStats.networkHealth * 100} className="h-2" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Encryption Strength</span>
                <Badge variant={getHealthBadge(systemMetrics.encryptionStrength) as any}>
                  {systemMetrics.encryptionStrength}%
                </Badge>
              </div>
              <Progress value={systemMetrics.encryptionStrength} className="h-2" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Consensus Health</span>
                <Badge variant={getHealthBadge(systemMetrics.consensusHealth) as any}>
                  {Math.round(systemMetrics.consensusHealth)}%
                </Badge>
              </div>
              <Progress value={systemMetrics.consensusHealth} className="h-2" />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="text-center">
              <div className="text-lg font-bold text-primary">{systemMetrics.messageLatency}ms</div>
              <div className="text-xs text-muted-foreground">Latency</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blockchain">{blockchainStats.blocks}</div>
              <div className="text-xs text-muted-foreground">Blocks</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-encrypted">{networkStats.totalMessages}</div>
              <div className="text-xs text-muted-foreground">Messages</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Detailed Status */}
      <Card className="border-primary/20 bg-gradient-command p-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-primary">Component Status</h3>
          </div>

          <div className="space-y-3">
            {/* Network Component */}
            <Card className="p-3 bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Wifi className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">P2P Network</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <Badge variant="default">ACTIVE</Badge>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {networkStats.onlineNodes} of {networkStats.totalNodes} nodes online
              </div>
            </Card>

            {/* Blockchain Component */}
            <Card className="p-3 bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4 text-blockchain" />
                  <span className="text-sm font-medium">Blockchain Ledger</span>
                </div>
                <div className="flex items-center space-x-2">
                  {blockchainStats.isValid ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  )}
                  <Badge variant={blockchainStats.isValid ? "default" : "destructive"}>
                    {blockchainStats.isValid ? "VALID" : "ERROR"}
                  </Badge>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {blockchainStats.blocks} blocks, {blockchainStats.messages} messages
              </div>
            </Card>

            {/* Encryption Component */}
            <Card className="p-3 bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Lock className="h-4 w-4 text-encrypted" />
                  <span className="text-sm font-medium">End-to-End Encryption</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <Badge variant="default">SECURE</Badge>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                RSA-2048 + AES-256 encryption active
              </div>
            </Card>

            {/* Vector Clock Component */}
            <Card className="p-3 bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-warning" />
                  <span className="text-sm font-medium">Vector Clock Sync</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <Badge variant="default">SYNCED</Badge>
                </div>
              </div>
              <div className="mt-2">
                <div className="flex flex-wrap gap-1">
                  {clockData.map((node) => (
                    <Badge 
                      key={node.nodeId} 
                      variant={node.isSelf ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {node.nodeId}: {node.value}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Security Alerts */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Security Status</h4>
            <div className="space-y-2">
              {networkStats.networkPartitions > 0 ? (
                <div className="flex items-center space-x-2 p-2 bg-warning/10 border border-warning/20 rounded">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <span className="text-sm text-warning">
                    Network partition detected ({networkStats.networkPartitions} nodes affected)
                  </span>
                </div>
              ) : null}

              {!networkStats.serverOnline ? (
                <div className="flex items-center space-x-2 p-2 bg-destructive/10 border border-destructive/20 rounded">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="text-sm text-destructive">
                    Central server offline - P2P mode activated
                  </span>
                </div>
              ) : null}

              {networkStats.offlineNodes > 0 ? (
                <div className="flex items-center space-x-2 p-2 bg-warning/10 border border-warning/20 rounded">
                  <Radio className="h-4 w-4 text-warning" />
                  <span className="text-sm text-warning">
                    {networkStats.offlineNodes} node(s) unreachable
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 p-2 bg-success/10 border border-success/20 rounded">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="text-sm text-success">
                    All security systems operational
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}