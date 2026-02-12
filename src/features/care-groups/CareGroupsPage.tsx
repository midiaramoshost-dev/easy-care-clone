import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, ArrowLeft, Heart, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCareGroups, useCreateCareGroup } from "@/hooks/useCareGroup";

const CareGroupsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { careGroups, isLoading } = useCareGroups();
  const createCareGroup = useCreateCareGroup();
  const [newGroupName, setNewGroupName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreate = () => {
    if (!newGroupName.trim()) return;
    createCareGroup.mutate({ name: newGroupName }, {
      onSuccess: () => {
        setNewGroupName("");
        setDialogOpen(false);
      },
    });
  };

  const roleLabels: Record<string, string> = {
    responsavel: "Responsável",
    cuidador: "Cuidador",
    admin_empresa: "Admin Empresa",
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
              <Heart className="w-6 h-6" /> Grupos de Cuidado
            </h1>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Novo Grupo</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Grupo de Cuidado</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nome do Grupo</Label>
                  <Input
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Ex: Cuidados da Vovó Maria"
                  />
                </div>
                <Button onClick={handleCreate} disabled={!newGroupName.trim() || createCareGroup.isPending} className="w-full">
                  Criar Grupo
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <p className="text-muted-foreground text-center py-12">Carregando...</p>
        ) : careGroups.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum grupo de cuidado</h3>
              <p className="text-muted-foreground mb-4">
                Crie seu primeiro grupo de cuidado para começar a organizar o monitoramento.
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Criar Primeiro Grupo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {careGroups.map((cg: any) => (
              <Card key={cg.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/care-groups/${cg.id}`)}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{cg.name}</CardTitle>
                    <Badge variant={cg.status === "active" ? "default" : "secondary"}>
                      {cg.status === "active" ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <CardDescription>
                    Seu papel: <span className="font-medium">{roleLabels[cg.userRole] || cg.userRole}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" className="w-full justify-between" onClick={(e) => { e.stopPropagation(); navigate(`/care-groups/${cg.id}`); }}>
                    Ver detalhes <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CareGroupsPage;
