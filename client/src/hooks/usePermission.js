import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";

export function usePermission() {
  const { hasPermission } = useAuth();
  const toast = useToast();

  const check = (moduleName, action) => {
    if (!hasPermission(moduleName, action)) {
      toast(`Access Denied: You need '${action}' permission for ${moduleName}.`, "error");
      return false;
    }
    return true;
  };

  return check;
}
