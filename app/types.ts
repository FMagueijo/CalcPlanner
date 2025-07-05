export interface Material {
  id: string;
  nome: string;
  precoMetroQuadrado: number;
  unidade: string;
}

export interface ItemOrcamento {
  materialId: string;
  quantidade: number;
  selecionado: boolean;
}

export interface Orcamento {
  id: string;
  nome: string;
  materiais: ItemOrcamento[];
  precoMaoObraM2: number;
  acabamentos: number;
  dataCreateon: Date;
  total: number;
} 