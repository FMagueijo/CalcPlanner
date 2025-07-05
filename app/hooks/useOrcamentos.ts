import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { MATERIAIS_DEFAULT } from '../data/materiaisDefault';
import { ItemOrcamento, Material, Orcamento } from '../types';

const STORAGE_KEYS = {
  MATERIAIS: '@calcplanner_materiais',
  ORCAMENTOS: '@calcplanner_orcamentos'
};

// Estado global para compartilhar entre as telas
let globalOrcamentoParaEditar: Orcamento | null = null;
let subscribers: (() => void)[] = [];

export const useOrcamentos = () => {
  const [materiais, setMateriais] = useState<Material[]>(MATERIAIS_DEFAULT);
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [orcamentoParaEditar, setOrcamentoParaEditar] = useState<Orcamento | null>(null);

  // Subscription para atualizações
  useEffect(() => {
    const updateState = () => {
      setOrcamentoParaEditar(globalOrcamentoParaEditar);
    };
    
    subscribers.push(updateState);
    updateState(); // Aplicar estado atual
    
    return () => {
      subscribers = subscribers.filter(sub => sub !== updateState);
    };
  }, []);

  // Carregar dados salvos
  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      console.log('Hook: Iniciando carregamento de dados...');
      
      const materiaisSalvos = await AsyncStorage.getItem(STORAGE_KEYS.MATERIAIS);
      const orcamentosSalvos = await AsyncStorage.getItem(STORAGE_KEYS.ORCAMENTOS);

      console.log('Hook: Materiais salvos encontrados:', materiaisSalvos ? 'Sim' : 'Não');
      console.log('Hook: Orçamentos salvos encontrados:', orcamentosSalvos ? 'Sim' : 'Não');

      if (materiaisSalvos) {
        const materiaisParsed = JSON.parse(materiaisSalvos);
        console.log('Hook: Materiais carregados:', materiaisParsed.length);
        setMateriais(materiaisParsed);
      }

      if (orcamentosSalvos) {
        const orcamentosData = JSON.parse(orcamentosSalvos);
        console.log('Hook: Orçamentos raw carregados:', orcamentosData);
        
        // Converter datas de string para Date
        const orcamentosComData = orcamentosData.map((orc: any) => ({
          ...orc,
          dataCreateon: new Date(orc.dataCreateon)
        }));
        
        console.log('Hook: Orçamentos processados:', orcamentosComData);
        setOrcamentos(orcamentosComData);
      } else {
        console.log('Hook: Nenhum orçamento encontrado no storage');
      }
    } catch (error) {
      console.error('Hook: Erro ao carregar dados:', error);
    } finally {
      console.log('Hook: Finalizando carregamento, loading = false');
      setLoading(false);
    }
  };

  const salvarMateriais = async (novosMateriais: Material[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MATERIAIS, JSON.stringify(novosMateriais));
      setMateriais(novosMateriais);
    } catch (error) {
      console.error('Erro ao salvar materiais:', error);
    }
  };

  const salvarOrcamentos = async (novosOrcamentos: Orcamento[]) => {
    try {
      console.log('Hook: Salvando orçamentos:', novosOrcamentos);
      console.log('Hook: Quantidade a salvar:', novosOrcamentos.length);
      
      const orcamentosString = JSON.stringify(novosOrcamentos);
      console.log('Hook: Orçamentos serializados:', orcamentosString);
      
      await AsyncStorage.setItem(STORAGE_KEYS.ORCAMENTOS, orcamentosString);
      console.log('Hook: AsyncStorage.setItem concluído');
      
      setOrcamentos(novosOrcamentos);
      console.log('Hook: setOrcamentos chamado com:', novosOrcamentos);
      console.log('Hook: Orçamentos salvos com sucesso');
    } catch (error) {
      console.error('Hook: Erro ao salvar orçamentos:', error);
    }
  };

  const atualizarPrecoMaterial = (materialId: string, novoPreco: number) => {
    const materiaisAtualizados = materiais.map(material =>
      material.id === materialId
        ? { ...material, precoMetroQuadrado: novoPreco }
        : material
    );
    salvarMateriais(materiaisAtualizados);
  };

  const calcularTotal = (
    itens: ItemOrcamento[],
    precoMaoObraM2: number,
    acabamentos: number
  ): number => {
    const totalMateriais = itens.reduce((total, item) => {
      if (!item.selecionado) return total;
      
      const material = materiais.find(m => m.id === item.materialId);
      if (!material) return total;
      
      return total + (material.precoMetroQuadrado * item.quantidade);
    }, 0);

    const totalMaoObra = itens.reduce((total, item) => {
      return item.selecionado ? total + (precoMaoObraM2 * item.quantidade) : total;
    }, 0);

    return totalMateriais + totalMaoObra + acabamentos;
  };

  const criarOrcamento = (orcamento: Omit<Orcamento, 'id' | 'dataCreateon' | 'total'>) => {
    console.log('Hook: Criando orçamento:', orcamento);
    console.log('Hook: Orçamentos atuais antes:', orcamentos);
    
    const novoOrcamento: Orcamento = {
      ...orcamento,
      id: Date.now().toString(),
      dataCreateon: new Date(),
      total: calcularTotal(orcamento.materiais, orcamento.precoMaoObraM2, orcamento.acabamentos)
    };

    console.log('Hook: Novo orçamento criado:', novoOrcamento);
    console.log('Hook: Total calculado:', novoOrcamento.total);

    const novosOrcamentos = [...orcamentos, novoOrcamento];
    console.log('Hook: Novos orçamentos array:', novosOrcamentos);
    console.log('Hook: Quantidade de orçamentos:', novosOrcamentos.length);
    
    salvarOrcamentos(novosOrcamentos);
    console.log('Hook: Função salvarOrcamentos chamada');
    
    return novoOrcamento;
  };

  const removerOrcamento = (orcamentoId: string) => {
    const novosOrcamentos = orcamentos.filter(orc => orc.id !== orcamentoId);
    salvarOrcamentos(novosOrcamentos);
  };

  const carregarOrcamento = (orcamento: Orcamento) => {
    console.log('Hook: Carregando orçamento para edição:', orcamento.nome);
    console.log('Hook: Dados completos:', orcamento);
    
    globalOrcamentoParaEditar = orcamento;
    console.log('Hook: Global orcamento para editar definido:', globalOrcamentoParaEditar);
    
    subscribers.forEach(sub => {
      console.log('Hook: Notificando subscriber');
      sub();
    });
  };

  const limparOrcamentoParaEditar = () => {
    globalOrcamentoParaEditar = null;
    subscribers.forEach(sub => sub());
  };

  return {
    materiais,
    orcamentos,
    loading,
    orcamentoParaEditar,
    atualizarPrecoMaterial,
    calcularTotal,
    criarOrcamento,
    removerOrcamento,
    carregarOrcamento,
    limparOrcamentoParaEditar
  };
}; 