import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Permission {
  resource: string;
  action: string;
  description: string | null;
}

export const usePermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    loadPermissions();
  }, [user]);

  const loadPermissions = async () => {
    try {
      const { data, error } = await supabase.rpc("get_user_permissions" as any, {
        _user_id: user?.id,
      });

      if (error) throw error;

      setPermissions((data as any) || []);
    } catch (error) {
      console.error("Error loading permissions:", error);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (resource: string, action: string): boolean => {
    return permissions.some(
      (p) => p.resource === resource && p.action === action
    );
  };

  const canView = (resource: string) => hasPermission(resource, "view");
  const canCreate = (resource: string) => hasPermission(resource, "create");
  const canUpdate = (resource: string) => hasPermission(resource, "update");
  const canDelete = (resource: string) => hasPermission(resource, "delete");

  return {
    permissions,
    loading,
    hasPermission,
    canView,
    canCreate,
    canUpdate,
    canDelete,
    reload: loadPermissions,
  };
};
