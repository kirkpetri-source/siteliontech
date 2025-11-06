import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Users, Trash, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profiles: {
    display_name: string;
  };
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  moderator: "Moderador",
  editor: "Editor",
  viewer: "Visualizador",
  user: "Usuário",
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  super_admin: "Controle total do sistema, incluindo configurações críticas",
  admin: "Gerenciamento completo exceto configurações críticas do sistema",
  moderator: "Gerenciar pedidos, cupons, contatos e visualizar produtos",
  editor: "Gerenciar produtos, estoque e visualizar pedidos",
  viewer: "Apenas visualização de relatórios e dados",
  user: "Usuário padrão com acesso limitado",
};

export const RolesManager = () => {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; roleId: string | null }>({
    open: false,
    roleId: null,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadUserRoles();
  }, []);

  const loadUserRoles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_roles" as any)
        .select("*, profiles(display_name)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setUserRoles((data as any) || []);
    } catch (error: any) {
      console.error("Error loading user roles:", error);
      toast({
        title: "Erro ao carregar roles",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!deleteDialog.roleId) return;

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", deleteDialog.roleId);

      if (error) throw error;

      toast({
        title: "Role removida",
        description: "A role foi removida com sucesso",
      });

      loadUserRoles();
    } catch (error: any) {
      console.error("Error deleting role:", error);
      toast({
        title: "Erro ao remover role",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteDialog({ open: false, roleId: null });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Agrupar por usuário
  const userRolesGrouped = userRoles.reduce((acc, ur) => {
    const key = ur.user_id;
    if (!acc[key]) {
      acc[key] = {
        user_id: ur.user_id,
        display_name: ur.profiles?.display_name || "Sem nome",
        roles: [],
      };
    }
    acc[key].roles.push({ id: ur.id, role: ur.role, created_at: ur.created_at });
    return acc;
  }, {} as Record<string, { user_id: string; display_name: string; roles: Array<{ id: string; role: string; created_at: string }> }>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Descrição das Roles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(ROLE_LABELS).map(([role, label]) => (
              <div key={role} className="flex items-start gap-3 p-3 border rounded-lg">
                <Shield className="h-5 w-5 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold">{label}</div>
                  <div className="text-sm text-muted-foreground">
                    {ROLE_DESCRIPTIONS[role]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Usuários e suas Roles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.values(userRolesGrouped).map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell className="font-medium">{user.display_name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((r) => (
                        <Badge key={r.id} variant="secondary">
                          {ROLE_LABELS[r.role] || r.role}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {user.roles.map((r) => (
                        <Button
                          key={r.id}
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteDialog({ open: true, roleId: r.id })}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, roleId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta role do usuário? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRole}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
