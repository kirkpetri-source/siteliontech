import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Database, Download, Calendar, Clock, HardDrive, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Backup {
  id: string;
  created_at: string;
  status: string;
  type: string;
  file_size: number | null;
  tables_backed_up: string[] | null;
  error_message: string | null;
  completed_at: string | null;
}

export const BackupsManager = () => {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [nextScheduled, setNextScheduled] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchBackups();
    calculateNextScheduled();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('backups-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'backups' }, () => {
        fetchBackups();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const calculateNextScheduled = () => {
    // Calculate next backup at midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    setNextScheduled(tomorrow);
  };

  const fetchBackups = async () => {
    const { data, error } = await supabase
      .from('backups')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      toast({
        title: "Erro ao carregar backups",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setBackups(data || []);
    }
    setLoading(false);
  };

  const createBackup = async () => {
    setCreating(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('create-backup', {
        body: { type: 'manual' },
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`
        } : {}
      });

      if (response.error) {
        throw response.error;
      }

      // Download the backup data
      const backupData = response.data?.data;
      if (backupData) {
        downloadBackup(backupData, response.data.backup_id);
      }

      toast({
        title: "Backup criado com sucesso",
        description: `Backup gerado com ${formatBytes(response.data?.size || 0)}`,
      });

      fetchBackups();
    } catch (error: any) {
      console.error('Error creating backup:', error);
      toast({
        title: "Erro ao criar backup",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const downloadBackup = (data: any, backupId: string) => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${backupId}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      completed: "default",
      in_progress: "secondary",
      failed: "destructive",
      pending: "outline",
    };
    return variants[status] || "outline";
  };

  const getTypeBadge = (type: string) => {
    return type === 'automatic' ? "secondary" : "outline";
  };

  if (loading) {
    return <div className="flex justify-center p-8">Carregando backups...</div>;
  }

  const completedBackups = backups.filter(b => b.status === 'completed');
  const lastBackup = completedBackups[0];
  const totalSize = completedBackups.reduce((sum, b) => sum + (b.file_size || 0), 0);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Backups</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{backups.length}</div>
            <p className="text-xs text-muted-foreground">
              {completedBackups.length} concluídos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Último Backup</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lastBackup ? new Date(lastBackup.created_at).toLocaleDateString('pt-BR') : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              {lastBackup ? new Date(lastBackup.created_at).toLocaleTimeString('pt-BR') : 'Nenhum backup'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamanho Total</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(totalSize)}</div>
            <p className="text-xs text-muted-foreground">
              Espaço utilizado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximo Agendado</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {nextScheduled ? new Date(nextScheduled).toLocaleDateString('pt-BR') : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              00:00 (meia-noite)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Os backups são executados automaticamente todos os dias à meia-noite. 
          Você também pode criar backups manuais a qualquer momento.
        </AlertDescription>
      </Alert>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Criar Backup Manual
          </CardTitle>
          <CardDescription>
            Gere um backup instantâneo de todos os dados do banco
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={createBackup} disabled={creating}>
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando backup...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Criar Backup Agora
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Backups History */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Backups</CardTitle>
          <CardDescription>Últimos 50 backups realizados</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tabelas</TableHead>
                <TableHead className="text-right">Tamanho</TableHead>
                <TableHead>Duração</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhum backup realizado ainda
                  </TableCell>
                </TableRow>
              ) : (
                backups.map((backup) => {
                  const duration = backup.completed_at
                    ? Math.round(
                        (new Date(backup.completed_at).getTime() - 
                         new Date(backup.created_at).getTime()) / 1000
                      )
                    : null;

                  return (
                    <TableRow key={backup.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {new Date(backup.created_at).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(backup.created_at).toLocaleTimeString('pt-BR')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTypeBadge(backup.type)}>
                          {backup.type === 'automatic' ? 'Automático' : 'Manual'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(backup.status)}>
                          {backup.status === 'completed' && 'Concluído'}
                          {backup.status === 'in_progress' && 'Em andamento'}
                          {backup.status === 'failed' && 'Falhou'}
                          {backup.status === 'pending' && 'Pendente'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {backup.tables_backed_up?.length || 0} tabelas
                      </TableCell>
                      <TableCell className="text-right">
                        {backup.file_size ? formatBytes(backup.file_size) : '-'}
                      </TableCell>
                      <TableCell>
                        {duration ? `${duration}s` : '-'}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
