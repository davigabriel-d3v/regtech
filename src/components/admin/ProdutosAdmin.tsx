import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Eye, ImagePlus, Loader2, Pencil, Plus, Save, Star, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Category = { id: string; name: string };
type Brand = { id: string; nome: string };
type ProductImage = { id: string; product_id: string; storage_path: string; image_url: string; is_primary: boolean; display_order: number };
type Product = {
  id: string; product_code: string; name: string; description: string | null; category_id: string | null;
  brand_id: string | null; price: number; promotional_price: number | null; stock: number;
  minimum_stock: number; sku: string | null; barcode: string | null; notes: string | null;
  status: "active" | "inactive"; created_at: string; updated_at: string;
  product_images?: ProductImage[];
};

const emptyForm = {
  name: "", description: "", category_id: "", brand_id: "", price: "", promotional_price: "",
  stock: "0", minimum_stock: "0", sku: "", barcode: "", notes: "", status: "active" as "active" | "inactive",
};

const pageSize = 10;
const money = (v: number | null) => v == null ? "—" : Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function ProdutosAdmin() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Product | null>(null);
  const [viewing, setViewing] = useState<Product | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const replaceInput = useRef<HTMLInputElement>(null);
  const [replaceTarget, setReplaceTarget] = useState<ProductImage | null>(null);
  const dragIndex = useRef<number | null>(null);

  async function load() {
    setLoading(true);
    const [p, c, b] = await Promise.all([
      supabase.from("products").select("*, product_images(*)").order("created_at", { ascending: false }),
      supabase.from("product_categories").select("id,name").order("name"),
      supabase.from("marcas").select("id,nome").eq("ativo", true).order("nome"),
    ]);
    if (p.error) toast.error("Não foi possível carregar os produtos: " + p.error.message);
    setProducts((p.data ?? []) as Product[]);
    setCategories((c.data ?? []) as Category[]);
    setBrands((b.data ?? []) as Brand[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(p => {
      const categoryOk = categoryFilter === "all" || p.category_id === categoryFilter;
      const statusOk = statusFilter === "all" || p.status === statusFilter;
      const textOk = !q || [p.name, p.product_code, p.sku ?? "", p.id].some(v => v.toLowerCase().includes(q));
      return categoryOk && statusOk && textOk;
    });
  }, [products, query, categoryFilter, statusFilter]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { if (page > pages) setPage(pages); }, [page, pages]);

  function openCreate() {
    setEditing(null); setForm(emptyForm); setImages([]); setFiles([]); setFormOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name, description: p.description ?? "", category_id: p.category_id ?? "", brand_id: p.brand_id ?? "",
      price: String(p.price), promotional_price: p.promotional_price == null ? "" : String(p.promotional_price),
      stock: String(p.stock), minimum_stock: String(p.minimum_stock), sku: p.sku ?? "", barcode: p.barcode ?? "",
      notes: p.notes ?? "", status: p.status,
    });
    setImages([...(p.product_images ?? [])].sort((a,b) => a.display_order - b.display_order));
    setFiles([]); setFormOpen(true);
  }

  function closeForm() {
    if (!saving) { setFormOpen(false); setFiles([]); setImages([]); }
  }

  function onFiles(selected: FileList | null) {
    if (!selected) return;
    const accepted = Array.from(selected).filter(f => f.type.startsWith("image/"));
    setFiles(prev => [...prev, ...accepted]);
  }

  async function uploadImage(productId: string, file: File, order: number, primary: boolean) {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${crypto.randomUUID()}/${productId}.${ext}`;
    const upload = await supabase.storage.from("product-images").upload(path, file, { upsert: false, contentType: file.type });
    if (upload.error) throw upload.error;
    const { data: publicData } = supabase.storage.from("product-images").getPublicUrl(path);
    const { data, error } = await supabase.from("product_images").insert({
      product_id: productId, storage_path: path, image_url: publicData.publicUrl, display_order: order, is_primary: primary,
    }).select().single();
    if (error) throw error;
    return data as ProductImage;
  }

  async function save() {
    if (!form.name.trim() || !form.category_id || !form.brand_id) {
      toast.error("Preencha nome, categoria e marca."); return;
    }
    const price = Number(form.price.replace(",", "."));
    const promo = form.promotional_price.trim() === "" ? null : Number(form.promotional_price.replace(",", "."));
    if (!Number.isFinite(price) || price < 0 || (promo != null && (!Number.isFinite(promo) || promo < 0 || promo > price))) {
      toast.error("Confira os valores de preço."); return;
    }
    setSaving(true);
    try {
      let productId = editing?.id;
      if (editing) {
        const { error } = await supabase.from("products").update({
          name: form.name.trim(), description: form.description.trim() || null, category_id: form.category_id,
          brand_id: form.brand_id, price, promotional_price: promo, stock: Number(form.stock),
          minimum_stock: Number(form.minimum_stock), sku: form.sku.trim() || null, barcode: form.barcode.trim() || null,
          notes: form.notes.trim() || null, status: form.status,
        }).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("products").insert({
          name: form.name.trim(), description: form.description.trim() || null, category_id: form.category_id,
          brand_id: form.brand_id, price, promotional_price: promo, stock: Number(form.stock),
          minimum_stock: Number(form.minimum_stock), sku: form.sku.trim() || null, barcode: form.barcode.trim() || null,
          notes: form.notes.trim() || null, status: form.status,
        }).select("*, product_images(*)").single();
        if (error) throw error;
        productId = data.id;
      }

      if (!productId) throw new Error("Produto sem ID.");
      const uploaded: ProductImage[] = [];
      for (let i = 0; i < files.length; i++) {
        uploaded.push(await uploadImage(productId, files[i], images.length + i, images.length === 0 && i === 0));
      }

      const nextImages = [...images, ...uploaded];
      if (nextImages.length > 0) {
        const primaryId = nextImages.find(i => i.is_primary)?.id ?? nextImages[0].id;
        await supabase.from("product_images").update({ is_primary: false }).eq("product_id", productId);
        await supabase.from("product_images").update({ is_primary: true, display_order: 0 }).eq("id", primaryId);
        await Promise.all(nextImages.map((img, i) => supabase.from("product_images").update({ display_order: i }).eq("id", img.id)));
      }

      toast.success(editing ? "Produto atualizado!" : "Produto cadastrado!");
      setFormOpen(false); setFiles([]); setImages([]); await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar o produto.");
    } finally { setSaving(false); }
  }

  async function removeImage(img: ProductImage) {
    try {
      await supabase.storage.from("product-images").remove([img.storage_path]);
      const { error } = await supabase.from("product_images").delete().eq("id", img.id);
      if (error) throw error;
      const next = images.filter(i => i.id !== img.id);
      setImages(next);
      if (img.is_primary && next.length) {
        await supabase.from("product_images").update({ is_primary: false }).eq("product_id", img.product_id);
        await supabase.from("product_images").update({ is_primary: true }).eq("id", next[0].id);
      }
    } catch (e) { toast.error(e instanceof Error ? e.message : "Não foi possível excluir a imagem."); }
  }

  async function setPrimary(img: ProductImage) {
    await supabase.from("product_images").update({ is_primary: false }).eq("product_id", img.product_id);
    await supabase.from("product_images").update({ is_primary: true }).eq("id", img.id);
    setImages(prev => prev.map(i => ({ ...i, is_primary: i.id === img.id })));
  }

  async function replaceImage(img: ProductImage, file: File) {
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${crypto.randomUUID()}/${img.product_id}.${ext}`;
      const upload = await supabase.storage.from("product-images").upload(path, file, { upsert: false, contentType: file.type });
      if (upload.error) throw upload.error;
      const { data: publicData } = supabase.storage.from("product-images").getPublicUrl(path);
      const { error } = await supabase.from("product_images").update({ storage_path: path, image_url: publicData.publicUrl }).eq("id", img.id);
      if (error) throw error;
      await supabase.storage.from("product-images").remove([img.storage_path]);
      setImages(prev => prev.map(i => i.id === img.id ? { ...i, storage_path: path, image_url: publicData.publicUrl } : i));
      toast.success("Imagem substituída.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Não foi possível substituir a imagem."); }
  }

  async function reorder(from: number, to: number) {
    if (from === to) return;
    const next = [...images]; const [moved] = next.splice(from, 1); next.splice(to, 0, moved);
    setImages(next);
    await Promise.all(next.map((img, i) => supabase.from("product_images").update({ display_order: i }).eq("id", img.id)));
  }

  async function removeProduct() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const imgs = deleteTarget.product_images ?? [];
      if (imgs.length) await supabase.storage.from("product-images").remove(imgs.map(i => i.storage_path));
      const { error } = await supabase.from("products").delete().eq("id", deleteTarget.id);
      if (error) throw error;
      toast.success("Produto excluído.");
      setDeleteTarget(null); await load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Não foi possível excluir o produto."); }
    finally { setSaving(false); }
  }

  const field = (label: string, key: keyof typeof emptyForm, type = "text") => (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      <input type={type} value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})}
        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 outline-none focus:border-primary" />
    </label>
  );

  return <section className="space-y-5">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="flex-1">
        <h2 className="font-display text-2xl font-bold">Gerenciamento de produtos</h2>
        <p className="text-sm text-muted-foreground">Cadastro, fotos, preços e status. O ID é gerado automaticamente.</p>
      </div>
      <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
        <Plus className="h-4 w-4" /> Cadastrar produto
      </button>
    </div>

    <div className="grid gap-3 md:grid-cols-[1fr_180px_150px]">
      <input value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} placeholder="Buscar por nome, ID ou SKU" className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary" />
      <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }} className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm">
        <option value="all">Todas as categorias</option>
        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm">
        <option value="all">Todos os status</option><option value="active">Ativo</option><option value="inactive">Inativo</option>
      </select>
    </div>

    {loading ? <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div> :
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[920px] text-sm">
          <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="p-3">Foto</th><th className="p-3">Nome</th><th className="p-3">ID único</th><th className="p-3">Preço</th><th className="p-3">Estoque</th><th className="p-3">Status</th><th className="p-3">Ações</th>
          </tr></thead>
          <tbody>
            {rows.map(p => <tr key={p.id} className="border-b border-border last:border-0">
              <td className="p-3">{p.product_images?.sort((a,b)=>a.display_order-b.display_order)[0]?.image_url ? <img src={p.product_images.sort((a,b)=>a.display_order-b.display_order)[0].image_url} className="h-11 w-11 rounded-lg object-cover" /> : <div className="h-11 w-11 rounded-lg bg-secondary" />}</td>
              <td className="p-3"><div className="font-semibold">{p.name}</div><div className="text-xs text-muted-foreground">{p.sku || "Sem SKU"}</div></td>
              <td className="p-3"><button className="inline-flex items-center gap-1 font-mono text-xs text-primary" onClick={() => navigator.clipboard.writeText(p.product_code).then(()=>toast.success("ID copiado!"))}>{p.product_code}<Copy className="h-3.5 w-3.5" /></button></td>
              <td className="p-3">{money(p.promotional_price ?? p.price)}</td><td className="p-3">{p.stock}</td>
              <td className="p-3"><span className={`rounded-full px-2.5 py-1 text-xs ${p.status === "active" ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>{p.status === "active" ? "Ativo" : "Inativo"}</span></td>
              <td className="p-3"><div className="flex gap-1"><button title="Visualizar" onClick={()=>setViewing(p)} className="rounded-lg p-2 hover:bg-secondary"><Eye className="h-4 w-4"/></button><button title="Editar" onClick={()=>openEdit(p)} className="rounded-lg p-2 hover:bg-secondary"><Pencil className="h-4 w-4"/></button><button title="Excluir" onClick={()=>setDeleteTarget(p)} className="rounded-lg p-2 text-destructive hover:bg-secondary"><Trash2 className="h-4 w-4"/></button></div></td>
            </tr>)}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-10 text-center text-sm text-muted-foreground">Nenhum produto encontrado.</p>}
      </div>
    }

    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{filtered.length} produto(s)</span>
      <div className="flex items-center gap-2">
        <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Anterior</button>
        <span>Página {page} de {pages}</span>
        <button disabled={page===pages} onClick={()=>setPage(p=>p+1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Próxima</button>
      </div>
    </div>

    {formOpen && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background/80 p-4 backdrop-blur">
      <div className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-border bg-card p-6">
        <div className="flex items-center justify-between"><h3 className="font-display text-xl font-bold">{editing ? "Editar produto" : "Cadastrar produto"}</h3><button onClick={closeForm}><X/></button></div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            {field("Nome do produto","name")}
            <label className="block space-y-1.5 text-sm"><span className="font-medium">Descrição</span><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={4} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 outline-none focus:border-primary"/></label>
            <label className="block space-y-1.5 text-sm"><span className="font-medium">Categoria</span><select value={form.category_id} onChange={e=>setForm({...form,category_id:e.target.value})} className="w-full rounded-xl border border-border bg-background px-3 py-2.5">{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label className="block space-y-1.5 text-sm"><span className="font-medium">Marca</span><select value={form.brand_id} onChange={e=>setForm({...form,brand_id:e.target.value})} className="w-full rounded-xl border border-border bg-background px-3 py-2.5"><option value="">Selecione</option>{brands.map(b=><option key={b.id} value={b.id}>{b.nome}</option>)}</select></label>
            <div className="grid grid-cols-2 gap-3">{field("Preço","price","number")}{field("Preço promocional","promotional_price","number")}</div>
            <div className="grid grid-cols-2 gap-3">{field("Estoque","stock","number")}{field("Estoque mínimo","minimum_stock","number")}</div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">{field("SKU","sku")}{field("Código de barras","barcode")}</div>
            <label className="block space-y-1.5 text-sm"><span className="font-medium">Observações</span><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={4} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 outline-none focus:border-primary"/></label>
            <label className="block space-y-1.5 text-sm"><span className="font-medium">Status</span><select value={form.status} onChange={e=>setForm({...form,status:e.target.value as "active"|"inactive"})} className="w-full rounded-xl border border-border bg-background px-3 py-2.5"><option value="active">Ativo</option><option value="inactive">Inativo</option></select></label>
            <div className="rounded-2xl border border-border p-4">
              <div className="mb-3 flex items-center justify-between"><div><p className="font-semibold">Fotos do produto</p><p className="text-xs text-muted-foreground">Arraste, ordene e defina a principal.</p></div><button type="button" onClick={()=>fileInput.current?.click()} className="rounded-lg border px-3 py-2 text-sm"><ImagePlus className="mr-1 inline h-4 w-4"/>Adicionar</button></div>
              <input ref={fileInput} hidden type="file" accept="image/*" multiple onChange={e=>onFiles(e.target.files)}/>
              <div onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();onFiles(e.dataTransfer.files)}} className="rounded-xl border border-dashed border-border p-3">
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {images.map((img,i)=><div key={img.id} draggable onDragStart={()=>dragIndex.current=i} onDragOver={e=>e.preventDefault()} onDrop={()=>{if(dragIndex.current!==null){reorder(dragIndex.current,i);dragIndex.current=null}}} className="group relative overflow-hidden rounded-xl border border-border">
                    <img src={img.image_url} className="aspect-square w-full object-cover"/>
                    {img.is_primary && <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">Principal</span>}
                    <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-background/80 p-1 opacity-0 transition group-hover:opacity-100"><button type="button" onClick={()=>setPrimary(img)} title="Principal"><Star className="h-3.5 w-3.5"/></button><button type="button" onClick={()=>{setReplaceTarget(img);replaceInput.current?.click()}} title="Substituir"><Upload className="h-3.5 w-3.5"/></button><button type="button" onClick={()=>removeImage(img)} title="Excluir"><Trash2 className="h-3.5 w-3.5 text-destructive"/></button></div>
                  </div>)}
                  {files.map((f,i)=><div key={f.name+i} className="relative overflow-hidden rounded-xl border border-dashed border-primary/40 p-2 text-xs"><div className="aspect-square rounded-lg bg-secondary flex items-center justify-center"><ImagePlus className="h-6 w-6"/></div><p className="truncate mt-1">{f.name}</p></div>)}
                </div>
                {!images.length && !files.length && <div className="py-8 text-center text-sm text-muted-foreground">Selecione ou arraste fotos para cá.</div>}
              </div>
              <input ref={replaceInput} hidden type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(f&&replaceTarget)replaceImage(replaceTarget,f);e.currentTarget.value="";}}/>
            </div>
            <div className="rounded-xl bg-secondary/60 p-3 text-xs text-muted-foreground">ID único: <strong className="font-mono text-foreground">{editing?.product_code ?? "Será gerado ao salvar"}</strong>{editing && <button type="button" className="ml-2 text-primary" onClick={()=>navigator.clipboard.writeText(editing.product_code).then(()=>toast.success("ID copiado!"))}>Copiar ID</button>}</div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2"><button onClick={closeForm} className="rounded-full border px-4 py-2 text-sm">Cancelar</button><button disabled={saving} onClick={save} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving?<Loader2 className="h-4 w-4 animate-spin"/>:<Save className="h-4 w-4"/>} Salvar produto</button></div>
      </div>
    </div>}

    {viewing && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background/80 p-4 backdrop-blur"><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-border bg-card p-6"><div className="flex justify-between"><h3 className="font-display text-xl font-bold">{viewing.name}</h3><button onClick={()=>setViewing(null)}><X/></button></div><p className="mt-1 font-mono text-sm text-primary">{viewing.product_code}</p><div className="mt-5 grid gap-4 sm:grid-cols-2">{(viewing.product_images??[]).sort((a,b)=>a.display_order-b.display_order).map(i=><img key={i.id} src={i.image_url} className="aspect-square w-full rounded-xl object-cover"/> )}</div><div className="mt-5 grid grid-cols-2 gap-3 text-sm"><p><b>Preço:</b> {money(viewing.price)}</p><p><b>Estoque:</b> {viewing.stock}</p><p><b>Status:</b> {viewing.status==="active"?"Ativo":"Inativo"}</p><p><b>SKU:</b> {viewing.sku||"—"}</p></div><p className="mt-4 text-sm text-muted-foreground">{viewing.description||"Sem descrição."}</p></div></div>}

    {deleteTarget && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-background/80 p-4 backdrop-blur"><div className="w-full max-w-md rounded-3xl border border-border bg-card p-6"><h3 className="font-display text-lg font-bold">Excluir produto</h3><p className="mt-2 text-sm text-muted-foreground">Tem certeza que deseja excluir este produto?</p><div className="mt-6 flex justify-end gap-2"><button onClick={()=>setDeleteTarget(null)} className="rounded-full border px-4 py-2 text-sm">Cancelar</button><button onClick={removeProduct} disabled={saving} className="rounded-full bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground">Excluir</button></div></div></div>}
  </section>;
}
