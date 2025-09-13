import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { P2PNetworkSimulator, NetworkNode, NetworkEvent } from '@/lib/p2pNetwork';
import { Users, Wifi, WifiOff, AlertTriangle, Server, Radio, Shield } from 'lucide-react';

interface NetworkTopologyProps {
  network: P2PNetworkSimulator;
  currentNodeId: string;
}

export function NetworkTopology({ network, currentNodeId }: NetworkTopologyProps) {
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [events, setEvents] = useState<NetworkEvent[]>([]);
  const [stats, setStats] = useState(network.getNetworkStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setNodes(network.getNodes());
      setEvents(network.getEvents(10));
      setStats(network.getNetworkStats());
    }, 1000);

    return () => clearInterval(interval);
  }, [network]);

  const getNodeIcon = (role: NetworkNode['role']) => {
    switch (role) {
      case 'command':
        return Shield;
      case 'field':
        return Radio;
      case 'relay':
        return Wifi;
    }
  };

  const getStatusColor = (status: NetworkNode['status']) => {
    switch (status) {
      case 'online':
        return 'bg-success';
      case 'degraded':
        return 'bg-warning';
      case 'offline':
        return 'bg-destructive';
    }
  };

  const getEventIcon = (type: NetworkEvent['type']) => {
    switch (type) {
      case 'node_join':
        return <Users className="h-4 w-4 text-success" />;
      case 'node_leave':
        return <Users className="h-4 w-4 text-destructive" />;
      case 'message_sent':
        return <Radio className="h-4 w-4 text-primary" />;
      case 'network_partition':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      default:
        return <Server className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const handleToggleServer = () => {
    network.toggleServerStatus();
  };

  const handleForceOffline = (nodeId: string) => {
    network.forceNodeOffline(nodeId);
  };

  const handleForceOnline = (nodeId: string) => {
    network.forceNodeOnline(nodeId);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Network Visualization */}
      <Card className="border-primary/20 bg-gradient-command p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-primary">Network Topology</h3>
            </div>
            <Button 
              variant={stats.serverOnline ? "destructive" : "default"}
              size="sm"
              onClick={handleToggleServer}
            >
              {stats.serverOnline ? 'Simulate Server Down' : 'Restore Server'}
            </Button>
          </div>

          {/* Network Map */}
          <div className="relative bg-muted/20 rounded-lg p-4 h-80">
            <div className="absolute inset-0 tactical-grid opacity-30"></div>
            
            {/* Server Status */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                stats.serverOnline ? 'bg-success/20 border border-success/40' : 'bg-destructive/20 border border-destructive/40'
              }`}>
                <Server className={`h-4 w-4 ${stats.serverOnline ? 'text-success' : 'text-destructive'}`} />
                <span className="text-xs font-mono">CENTRAL SERVER</span>
              </div>
            </div>

            {/* Nodes */}
            {nodes.map((node) => {
              const NodeIcon = getNodeIcon(node.role);
              const isCurrentNode = node.id === currentNodeId;
              
              return (
                <div
                  key={node.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                  style={{
                    left: `${node.position.x}%`,
                    top: `${node.position.y}%`,
                  }}
                  onClick={() => {
                    if (node.status === 'offline') {
                      handleForceOnline(node.id);
                    } else {
                      handleForceOffline(node.id);
                    }
                  }}
                >
                  <div className={`relative p-3 rounded-full border-2 transition-all duration-200 ${
                    isCurrentNode 
                      ? 'bg-primary/20 border-primary command-glow' 
                      : 'bg-muted/40 border-muted-foreground/20 hover:border-primary/40'
                  }`}>
                    <NodeIcon className={`h-6 w-6 ${
                      node.status === 'online' ? 'text-success' : 
                      node.status === 'degraded' ? 'text-warning' : 'text-destructive'
                    }`} />
                    
                    {/* Status indicator */}
                    <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${
                      getStatusColor(node.status)
                    } ${node.status === 'online' ? 'status-pulse' : ''}`}></div>
                  </div>

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-popover border border-border rounded-lg p-2 shadow-lg min-w-max">
                      <p className="text-xs font-semibold">{node.name}</p>
                      <p className="text-xs text-muted-foreground">ID: {node.id}</p>
                      <p className="text-xs text-muted-foreground">Status: {node.status}</p>
                      <p className="text-xs text-muted-foreground">Messages: {node.messageCount}</p>
                    </div>
                  </div>

                  {/* Connection lines to server (when online) */}
                  {node.status === 'online' && stats.serverOnline && (
                    <svg className="absolute inset-0 pointer-events-none" style={{ 
                      width: '100vw', 
                      height: '100vh',
                      left: '-50vw',
                      top: '-50vh'
                    }}>
                      <line
                        x1="50%"
                        y1="20%"
                        x2={`${node.position.x}%`}
                        y2={`${node.position.y}%`}
                        stroke="hsl(var(--primary))"
                        strokeWidth="1"
                        strokeOpacity="0.3"
                        strokeDasharray="2,2"
                      />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>

          {/* Network Statistics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{stats.onlineNodes}</div>
              <div className="text-xs text-muted-foreground">ONLINE</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">{stats.offlineNodes}</div>
              <div className="text-xs text-muted-foreground">OFFLINE</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Network Events & Controls */}
      <Card className="border-primary/20 bg-gradient-command p-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-primary">Network Events</h3>
          </div>

          {/* Node Controls */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Node Controls</h4>
            <div className="grid grid-cols-1 gap-2">
              {nodes.map((node) => (
                <div key={node.id} className="flex items-center justify-between p-2 bg-muted/20 rounded">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(node.status)}`} />
                    <span className="text-sm font-mono">{node.name}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (node.status === 'offline') {
                        handleForceOnline(node.id);
                      } else {
                        handleForceOffline(node.id);
                      }
                    }}
                    disabled={node.id === currentNodeId}
                  >
                    {node.status === 'offline' ? (
                      <>
                        <Wifi className="mr-1 h-3 w-3" />
                        Connect
                      </>
                    ) : (
                      <>
                        <WifiOff className="mr-1 h-3 w-3" />
                        Disconnect
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Event Log */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Recent Events</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {events.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent network events</p>
                </div>
              ) : (
                events.map((event) => (
                  <div key={event.id} className="flex items-center space-x-2 p-2 bg-muted/20 rounded text-sm">
                    {getEventIcon(event.type)}
                    <span className="flex-1 font-mono text-xs">
                      {event.type.replace('_', ' ').toUpperCase()}: {event.nodeId}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(event.timestamp)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}