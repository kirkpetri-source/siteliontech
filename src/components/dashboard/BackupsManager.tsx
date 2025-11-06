import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Database, Download, Calendar, Clock, HardDrive, AlertCircle, Loader2, Upload, Eye, RotateCcw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [backupPreview, setBackupPreview] = useState<any>(null);
  const [restoring, setRestoring] = useState(false);
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/json') {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, selecione um arquivo JSON de backup",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const previewBackup = async () => {
    if (!selectedFile) return;

    try {
      const text = await selectedFile.text();
      const backupData = JSON.parse(text);

      const { data: { session } } = await supabase.auth.getSession();

      const response = await supabase.functions.invoke('restore-backup', {
        body: { backupData, mode: 'preview' },
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`
        } : {}
      });

      if (response.error) {
        throw response.error;
      }

      setBackupPreview(response.data);
      setRestoreDialogOpen(false);
      setPreviewDialogOpen(true);

      toast({
        title: "Prévia gerada",
        description: `${response.data.totalRecords} registros em ${response.data.tables.length} tabelas`,
      });
    } catch (error: any) {
      console.error('Error previewing backup:', error);
      toast({
        title: "Erro ao visualizar backup",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const confirmRestore = () => {
    setPreviewDialogOpen(false);
    setConfirmDialogOpen(true);
  };

  const restoreBackup = async () => {
    if (!selectedFile) return;

    setRestoring(true);
    setConfirmDialogOpen(false);

    try {
      const text = await selectedFile.text();
      const backupData = JSON.parse(text);

      const { data: { session } } = await supabase.auth.getSession();

      const response = await supabase.functions.invoke('restore-backup', {
        body: { backupData, mode: 'restore' },
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`
        } : {}
      });

      if (response.error) {
        throw response.error;
      }

      toast({
        title: "Backup restaurado com sucesso",
        description: response.data.message,
      });

      // Reset state
      setSelectedFile(null);
      setBackupPreview(null);
      fetchBackups();
    } catch (error: any) {
      console.error('Error restoring backup:', error);
      toast({
        title: "Erro ao restaurar backup",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setRestoring(false);
    }
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
      <div className="grid gap-4 md:grid-cols-2">
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Restaurar Backup
            </CardTitle>
            <CardDescription>
              Restaure dados de um arquivo de backup anterior
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={() => setRestoreDialogOpen(true)}
              disabled={restoring}
            >
              {restoring ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Restaurando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Restaurar Backup
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

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

      {/* Restore Dialog - File Selection */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restaurar Backup</DialogTitle>
            <DialogDescription>
              Selecione um arquivo de backup JSON para restaurar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>ATENÇÃO:</strong> A restauração irá substituir TODOS os dados atuais pelos dados do backup. 
                Esta ação não pode ser desfeita. Recomendamos criar um backup atual antes de prosseguir.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="backup-file">Arquivo de Backup (JSON)</Label>
              <Input
                id="backup-file"
                type="file"
                accept=".json"
                onChange={handleFileSelect}
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Arquivo selecionado: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setRestoreDialogOpen(false);
              setSelectedFile(null);
            }}>
              Cancelar
            </Button>
            <Button onClick={previewBackup} disabled={!selectedFile}>
              <Eye className="mr-2 h-4 w-4" />
              Visualizar Prévia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Prévia do Backup</DialogTitle>
            <DialogDescription>
              Revise os dados que serão restaurados
            </DialogDescription>
          </DialogHeader>
          {backupPreview && (
            <div className="space-y-4 py-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total de Registros</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{backupPreview.totalRecords}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Tabelas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{backupPreview.tables.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Arquivo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm font-medium">{selectedFile?.name}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Dados por Tabela:</h4>
                {Object.entries(backupPreview.stats).map(([table, data]: [string, any]) => (
                  <Card key={table}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{table}</CardTitle>
                        <Badge>{data.count} registros</Badge>
                      </div>
                    </CardHeader>
                    {data.sample && data.sample.length > 0 && (
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-2">Amostra dos primeiros registros:</p>
                        <div className="bg-muted p-3 rounded text-xs overflow-x-auto">
                          <pre>{JSON.stringify(data.sample, null, 2)}</pre>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>

              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>IMPORTANTE:</strong> Ao confirmar, todos os dados atuais serão apagados e 
                  substituídos pelos dados do backup. Certifique-se de que este é o backup correto.
                </AlertDescription>
              </Alert>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setPreviewDialogOpen(false);
              setBackupPreview(null);
            }}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmRestore}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Confirmar Restauração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Esta ação irá <strong>APAGAR PERMANENTEMENTE</strong> todos os dados atuais 
                e substituí-los pelos dados do backup.
              </p>
              <p className="text-destructive font-semibold">
                Esta operação NÃO PODE ser desfeita!
              </p>
              <p>
                Recomendamos fortemente criar um backup dos dados atuais antes de prosseguir.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={restoreBackup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim, Restaurar Backup
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
