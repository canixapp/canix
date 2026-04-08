import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, AlertTriangle, Plus, Search, Edit2, Trash2, 
  ArrowUpRight, DollarSign, MoreVertical, CheckCircle2, Crown, ShoppingBag
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import * as inventoryService from '@/services/inventoryService';

const fmtCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export default function Estoque() {
  const { toast } = useToast();
  const [items, setItems] = useState<inventoryService.InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<inventoryService.InventoryRow | null>(null);
  const [formData, setFormData] = useState({
    name: '', category: '', quantity: 0, min_quantity: 0,
    purchase_price: 0, sale_price: 0, supplier: ''
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await inventoryService.getInventory();
      setItems(data);
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Erro ao carregar estoque.' });
    } finally {
      setLoading(false);
    }
  }, [toast]);
 
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    try {
      if (editingItem) {
        await inventoryService.updateInventoryItem(editingItem.id, formData);
        toast({ title: 'Produto atualizado com sucesso.' });
      } else {
        await inventoryService.createInventoryItem(formData);
        toast({ title: 'Produto adicionado com sucesso.' });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro ao salvar produto.' });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este produto?')) {
      await inventoryService.deleteInventoryItem(id);
      toast({ title: 'Produto removido.' });
      fetchData();
    }
  };

  const openForm = (item?: inventoryService.InventoryRow) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name, category: item.category, 
        quantity: item.quantity, min_quantity: item.min_quantity,
        purchase_price: item.purchase_price, sale_price: item.sale_price,
        supplier: item.supplier || ''
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '', category: '', quantity: 0, min_quantity: 0,
        purchase_price: 0, sale_price: 0, supplier: ''
      });
    }
    setIsModalOpen(true);
  };

  // Derived metrics
  const metrics = useMemo(() => {
    let totalValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    items.forEach(item => {
      totalValue += (item.purchase_price * item.quantity);
      if (item.quantity === 0) outOfStockCount++;
      else if (item.quantity <= item.min_quantity) lowStockCount++;
    });

    return { totalValue, lowStockCount, outOfStockCount, totalItems: items.length };
  }, [items]);

  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-8 animate-in fade-in duration-500">
      
      {/* HEADER TITLE & PRO BADGE */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-cyan-500/10">
            <ShoppingBag className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-500" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Estoque</h1>
            <p className="text-sm text-muted-foreground mt-1">Gestão inteligente de produtos e insumos</p>
          </div>
        </div>
        <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 flex items-center shadow-none px-2 py-0.5">
          <Crown className="w-3 h-3 mr-1" /> PRO
        </Badge>
      </div>

      {/* ACTIONS ROW */}
      <div className="flex justify-end">
        <Button 
          onClick={() => openForm()} 
          className="bg-cyan-600 hover:bg-cyan-700 text-white transition-all shadow-md"
        >
          <Plus className="mr-2 h-4 w-4" /> Adicionar Produto
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
          <Card className="border-none shadow-md bg-white dark:bg-zinc-900 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-muted-foreground">Total de Produtos</p>
                <div className="p-2 bg-cyan-100 dark:bg-cyan-500/10 rounded-lg">
                  <Package className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                </div>
              </div>
              <div className="text-3xl font-bold text-foreground">{metrics.totalItems}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
          <Card className="border-none shadow-md bg-white dark:bg-zinc-900 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-muted-foreground">Valor em Estoque</p>
                <div className="p-2 bg-emerald-100 dark:bg-emerald-500/10 rounded-lg">
                  <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <div className="text-3xl font-bold text-foreground">{fmtCurrency(metrics.totalValue)}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
          <Card className="border-none shadow-md bg-white dark:bg-zinc-900 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-muted-foreground">Estoque Baixo</p>
                <div className="p-2 bg-amber-100 dark:bg-amber-500/10 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <div className="text-3xl font-bold text-foreground">{metrics.lowStockCount}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
          <Card className="border-none shadow-md bg-white dark:bg-zinc-900 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-muted-foreground">Esgotados</p>
                <div className="p-2 bg-rose-100 dark:bg-rose-500/10 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                </div>
              </div>
              <div className="text-3xl font-bold text-foreground">{metrics.outOfStockCount}</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* SEARCH AND TABLE */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
        <Card className="border-none shadow-lg overflow-hidden glassmorphism">
          <div className="p-4 border-b bg-muted/20 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar produtos por nome ou categoria..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background/50 border-input/50 focus:bg-background transition-colors"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Exibindo <span className="font-semibold text-foreground">{filteredItems.length}</span> resultados
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Preço de Custo</TableHead>
                  <TableHead className="text-right">Preço de Venda</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      Carregando estoque...
                    </TableCell>
                  </TableRow>
                ) : filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      Nenhum produto encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  <AnimatePresence>
                    {filteredItems.map((item, index) => {
                      const isOutOfStock = item.quantity === 0;
                      const isLowStock = !isOutOfStock && item.quantity <= item.min_quantity;
                      
                      return (
                        <motion.tr 
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ delay: index * 0.05 }}
                          className="group hover:bg-muted/30 transition-colors border-b last:border-0"
                        >
                          <TableCell className="font-medium text-foreground py-4">
                            <div className="flex flex-col">
                              <span>{item.name}</span>
                              {item.supplier && <span className="text-[10px] text-muted-foreground">Fornecedor: {item.supplier}</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-background/50">{item.category}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {item.quantity}
                          </TableCell>
                          <TableCell>
                            {isOutOfStock ? (
                              <Badge className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-rose-500/20 shadow-none">
                                Esgotado
                              </Badge>
                            ) : isLowStock ? (
                              <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20 shadow-none">
                                Baixo
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 shadow-none">
                                Normal
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {fmtCurrency(item.purchase_price)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {fmtCurrency(item.sale_price)}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="group-hover:opacity-100 opacity-50 transition-opacity">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem onClick={() => openForm(item)} className="cursor-pointer">
                                  <Edit2 className="mr-2 h-4 w-4 text-cyan-500" /> Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDelete(item.id)} className="cursor-pointer text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 focus:bg-rose-50 dark:focus:bg-rose-950/50">
                                  <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </motion.div>

      {/* ADD / EDIT MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              {editingItem ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-4">
              <p className="text-sm font-medium text-muted-foreground">Detalhes do Produto</p>
              
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Produto</Label>
                <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Ração Golden 15kg" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Input id="category" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="Ex: Rações" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade Atual</Label>
                  <Input id="quantity" type="number" min="0" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 0})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_quantity">Estoque Mínimo</Label>
                  <Input id="min_quantity" type="number" min="0" value={formData.min_quantity} onChange={e => setFormData({...formData, min_quantity: parseInt(e.target.value) || 0})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchase_price">Preço de Custo (R$)</Label>
                  <Input id="purchase_price" type="number" step="0.01" min="0" value={formData.purchase_price} onChange={e => setFormData({...formData, purchase_price: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sale_price">Preço de Venda (R$)</Label>
                  <Input id="sale_price" type="number" step="0.01" min="0" value={formData.sale_price} onChange={e => setFormData({...formData, sale_price: parseFloat(e.target.value) || 0})} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">Fornecedor (Opcional)</Label>
                <Input id="supplier" value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} placeholder="Nome do fornecedor ou contato" />
              </div>
            </div>

            <Button onClick={handleSave} className="w-full h-12 text-base mt-2">
              {editingItem ? 'Salvar Alterações' : 'Criar Produto'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
