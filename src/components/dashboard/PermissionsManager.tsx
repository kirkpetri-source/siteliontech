import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Eye, Plus, Edit, Trash, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Permission {
  id: string;
  resource: string;
  action: string;
  description: string | null;
  created_at: string;
}

interface RolePermission {
  role: string;
  permissions: string[];
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  moderator: "Moderador",
  editor: "Editor",
  viewer: "Visualizador",
  user: "Usuário",
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-red-500",
  admin: "bg-orange-500",
  moderator: "bg-blue-500",
  editor: "bg-green-500",
  viewer: "bg-gray-500",
  user: "bg-slate-500",
};

export const PermissionsManager = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Carregar todas as permissões
      const { data: permsData, error: permsError } = await supabase
        .from("permissions" as any)
        .select("*")
        .order("resource", { ascending: true })
        .order("action", { ascending: true });

      if (permsError) throw permsError;

      // Carregar permissões por role
      const { data: rolePermsData, error: rolePermsError } = await supabase
        .from("role_permissions" as any)
        .select("role, permission_id");

      if (rolePermsError) throw rolePermsError;

      // Agrupar permissões por role
      const groupedByRole: Record<string, string[]> = {};
      rolePermsData?.forEach((rp: any) => {
        if (!groupedByRole[rp.role]) {
          groupedByRole[rp.role] = [];
        }
        groupedByRole[rp.role].push(rp.permission_id);
      });

      const rolePermsArray = Object.entries(groupedByRole).map(([role, perms]) => ({
        role,
        permissions: perms,
      }));

      setPermissions((permsData as any) || []);
      setRolePermissions(rolePermsArray);
    } catch (error: any) {
      console.error("Error loading permissions:", error);
      toast({
        title: "Erro ao carregar permissões",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Lock className="h-4 w-4" />;
      case "admin":
        return <Shield className="h-4 w-4" />;
      case "viewer":
        return <Eye className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "view":
        return <Eye className="h-3 w-3" />;
      case "create":
        return <Plus className="h-3 w-3" />;
      case "update":
        return <Edit className="h-3 w-3" />;
      case "delete":
        return <Trash className="h-3 w-3" />;
      default:
        return <Shield className="h-3 w-3" />;
    }
  };

  const hasRolePermission = (role: string, permissionId: string): boolean => {
    const rolePerms = rolePermissions.find((rp) => rp.role === role);
    return rolePerms?.permissions.includes(permissionId) || false;
  };

  // Agrupar permissões por recurso
  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.resource]) {
      acc[perm.resource] = [];
    }
    acc[perm.resource].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sistema de Permissões por Recurso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(groupedPermissions).map(([resource, perms]) => (
              <div key={resource} className="space-y-2">
                <h3 className="text-lg font-semibold capitalize">{resource}</h3>
                <div className="grid gap-2">
                  {perms.map((perm) => (
                    <div
                      key={perm.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getActionIcon(perm.action)}
                        <div>
                          <div className="font-medium capitalize">{perm.action}</div>
                          {perm.description && (
                            <div className="text-sm text-muted-foreground">
                              {perm.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {Object.keys(ROLE_LABELS).map((role) => (
                          <Badge
                            key={role}
                            variant={hasRolePermission(role, perm.id) ? "default" : "outline"}
                            className={hasRolePermission(role, perm.id) ? ROLE_COLORS[role] : ""}
                          >
                            {ROLE_LABELS[role]}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Matriz de Permissões por Role</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recurso / Ação</TableHead>
                {Object.entries(ROLE_LABELS).map(([role, label]) => (
                  <TableHead key={role} className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {getRoleIcon(role)}
                      {label}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(groupedPermissions).map(([resource, perms]) => (
                <>
                  <TableRow key={resource} className="bg-muted/50">
                    <TableCell colSpan={7} className="font-semibold capitalize">
                      {resource}
                    </TableCell>
                  </TableRow>
                  {perms.map((perm) => (
                    <TableRow key={perm.id}>
                      <TableCell className="pl-8 capitalize">{perm.action}</TableCell>
                      {Object.keys(ROLE_LABELS).map((role) => (
                        <TableCell key={role} className="text-center">
                          {hasRolePermission(role, perm.id) ? (
                            <Badge variant="default" className={ROLE_COLORS[role]}>
                              ✓
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
