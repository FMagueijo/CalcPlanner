import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { useOrcamentos } from './hooks/useOrcamentos';
import { Orcamento } from './types';

export default function OrcamentosScreen() {
  const { orcamentos, loading, removerOrcamento, carregarOrcamento, materiais, criarOrcamento } = useOrcamentos();
  const [selectedOrcamento, setSelectedOrcamento] = useState<Orcamento | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Log para debug
  console.log('OrcamentosScreen: loading =', loading);
  console.log('OrcamentosScreen: orcamentos =', orcamentos);
  console.log('OrcamentosScreen: quantidade de orçamentos =', orcamentos.length);

  const confirmarRemocao = (orcamento: Orcamento) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente excluir o orçamento '${orcamento.nome}'?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: () => {
            console.log('Removendo orçamento:', orcamento.id);
            removerOrcamento(orcamento.id);
          }
        }
      ]
    );
  };

  const verDetalhes = (orcamento: Orcamento) => {
    console.log('Ver detalhes:', orcamento.nome);
    setSelectedOrcamento(orcamento);
    setShowModal(true);
  };

  const exportarOrcamentoPDF = async (orcamento: Orcamento) => {
    console.log('Exportando PDF:', orcamento.nome);
    
    try {
      const html = gerarHTMLOrcamento(orcamento);
      await Print.printAsync({
        html: html,
      });
      Alert.alert('Sucesso', 'PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      Alert.alert('Erro', 'Erro ao gerar PDF. Tente novamente.');
    }
  };

  const abrirHTMLNoBrowser = (orcamento: Orcamento) => {
    console.log('Abrindo HTML:', orcamento.nome);
    
    try {
      const html = gerarHTMLOrcamento(orcamento);
      
      if (typeof window !== 'undefined' && window.open) {
        // Criar um blob com o HTML
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        // Abrir numa nova janela
        const newWindow = window.open(url, '_blank', 'width=800,height=600');
        
        // Limpar o URL após um tempo
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 1000);
        
        if (!newWindow) {
          Alert.alert('Erro', 'Não foi possível abrir o HTML. Verifique se o popup está bloqueado.');
        } else {
          Alert.alert('Sucesso', 'HTML aberto em nova janela!');
        }
      } else {
        // Fallback para mobile - mostrar o HTML em um alerta ou copiar para clipboard
        Alert.alert(
          'HTML Gerado', 
          'HTML gerado com sucesso! Em dispositivos móveis, use a função PDF.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Erro ao abrir HTML:', error);
      Alert.alert('Erro', 'Erro ao abrir HTML. Tente novamente.');
    }
  };

  const gerarHTMLOrcamento = (orcamento: Orcamento) => {
    // Calcular custos detalhados usando dados reais dos materiais
    const materiaisSelecionados = orcamento.materiais.filter(m => m.selecionado);
    
    const totalMateriais = materiaisSelecionados.reduce((total, item) => {
      const material = materiais.find(m => m.id === item.materialId);
      const precoMaterial = material ? material.precoMetroQuadrado : 25.50;
      return total + (item.quantidade * precoMaterial);
    }, 0);
    
    const totalMaoObra = materiaisSelecionados.reduce((total, item) => {
      return total + (item.quantidade * orcamento.precoMaoObraM2);
    }, 0);

    const htmlContent = `<!DOCTYPE html>
<html lang="pt-PT">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Orçamento - ${orcamento.nome}</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body { 
        font-family: Arial, Helvetica, sans-serif; 
        margin: 40px; 
        line-height: 1.6;
        color: #333;
        background-color: white;
      }
      
      .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }
      
      h1 { 
        color: #333; 
        text-align: center; 
        border-bottom: 3px solid #4A90E2;
        padding-bottom: 15px;
        margin-bottom: 30px;
        font-size: 28px;
      }
      
      h2 {
        color: #4A90E2;
        margin: 25px 0 15px 0;
        font-size: 20px;
      }
      
      .info {
        margin: 20px 0;
        padding: 20px;
        background-color: #f8f9fa;
        border-radius: 10px;
        border-left: 4px solid #4A90E2;
      }
      
      .cost-item {
        margin: 15px 0;
        padding: 12px 0;
        border-bottom: 1px solid #eee;
        font-size: 16px;
      }
      
      .cost-item strong {
        color: #4A90E2;
        font-weight: bold;
      }
      
      .total {
        font-size: 24px;
        font-weight: bold;
        text-align: center;
        margin: 40px 0;
        padding: 25px;
        background-color: #4A90E2;
        color: white;
        border-radius: 10px;
        box-shadow: 0 4px 8px rgba(74, 144, 226, 0.3);
      }
      
      .footer {
        text-align: center;
        margin-top: 50px;
        color: #666;
        font-size: 12px;
        border-top: 1px solid #eee;
        padding-top: 20px;
      }
      
      @media print {
        body {
          margin: 20px;
        }
        .container {
          max-width: none;
          padding: 0;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Orçamento: ${orcamento.nome}</h1>
      
      <div class="info">
        <strong>Data:</strong> ${new Date(orcamento.dataCreateon).toLocaleDateString('pt-PT')}<br>
        <strong>Materiais selecionados:</strong> ${materiaisSelecionados.length} itens
      </div>
      
      <h2>Custos Detalhados</h2>
      
      <div class="cost-item">
        <strong>Materiais:</strong> €${totalMateriais.toFixed(2)}
      </div>
      
      <div class="cost-item">
        <strong>Mão de Obra:</strong> €${totalMaoObra.toFixed(2)}
      </div>
      
      <div class="cost-item">
        <strong>Acabamentos:</strong> €${orcamento.acabamentos.toFixed(2)}
      </div>
      
      <div class="total">
        TOTAL: €${orcamento.total.toFixed(2)}
      </div>
      
      <div class="footer">
        Orçamento gerado automaticamente pelo sistema CalcPlanner<br>
        Data de geração: ${new Date().toLocaleDateString('pt-PT')} às ${new Date().toLocaleTimeString('pt-PT')}
      </div>
    </div>
  </body>
</html>`;

    console.log('HTML Content gerado:', htmlContent);
    return htmlContent;
  };

  const editarOrcamento = (orcamento: Orcamento) => {
    console.log('Editando orçamento:', orcamento.nome);
    console.log('Dados do orçamento:', orcamento);
    
    try {
      carregarOrcamento(orcamento);
      Alert.alert(
        'Orçamento Carregado',
        `O orçamento "${orcamento.nome}" foi carregado na aba "Novo Orçamento" para edição.`,
        [
          { 
            text: 'OK',
            onPress: () => {
              console.log('Usuário confirmou carregamento do orçamento');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erro ao carregar orçamento para edição:', error);
      Alert.alert('Erro', 'Erro ao carregar orçamento para edição. Tente novamente.');
    }
  };

  const criarOrcamentoTeste = () => {
    console.log('Criando orçamento de teste...');
    const orcamentoTeste = {
      nome: 'Teste ' + new Date().toLocaleTimeString(),
      materiais: [
        { materialId: '1', quantidade: 10, selecionado: true },
        { materialId: '2', quantidade: 5, selecionado: true }
      ],
      precoMaoObraM2: 25,
      acabamentos: 100
    };
    
    criarOrcamento(orcamentoTeste);
    Alert.alert('Teste', 'Orçamento de teste criado!');
  };

  const limparDados = async () => {
    try {
      await AsyncStorage.removeItem('@calcplanner_orcamentos');
      Alert.alert('Sucesso', 'Dados limpos! Recarregue a página.');
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
      Alert.alert('Erro', 'Erro ao limpar dados.');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

      return (
      <View style={[styles.container, { paddingTop: 0 }]}>
        <StatusBar style="light" />
        <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Orçamentos Salvos</Text>
        
        {/* Botão de teste para criar orçamento de exemplo */}
        <Pressable
          style={[styles.actionButton, { backgroundColor: '#10b981', marginBottom: 20 }]}
          onPress={criarOrcamentoTeste}
        >
          <Text style={styles.actionButtonText}>Criar Orçamento de Teste</Text>
        </Pressable>
        
        {/* Botão para limpar dados */}
        <Pressable
          style={[styles.actionButton, { backgroundColor: '#ef4444', marginBottom: 20 }]}
          onPress={limparDados}
        >
          <Text style={styles.actionButtonText}>Limpar Dados</Text>
        </Pressable>
        
        {orcamentos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={80} color="#ccc" />
            <Text style={styles.emptyText}>Nenhum orçamento salvo</Text>
            <Text style={styles.emptySubText}>
              Crie um orçamento na aba Novo Orçamento
            </Text>
          </View>
        ) : (
          <View style={styles.orcamentosList}>
            {orcamentos.map((orcamento) => (
              <View key={orcamento.id} style={styles.orcamentoCard}>
                <View style={styles.orcamentoHeader}>
                  <Text style={styles.orcamentoNome}>{orcamento.nome}</Text>
                  <Text style={styles.orcamentoTotal}>
                    €{orcamento.total.toFixed(2)}
                  </Text>
                </View>
                
                <Text style={styles.orcamentoData}>
                  {new Date(orcamento.dataCreateon).toLocaleDateString('pt-PT')}
                </Text>
                
                <View style={styles.orcamentoActions}>
                  <Pressable
                    style={[styles.actionButton, styles.viewButton]}
                    onPress={() => {
                      console.log('Botão Ver clicado para:', orcamento.nome);
                      verDetalhes(orcamento);
                    }}
                  >
                    <Ionicons name="eye-outline" size={16} color="#fff" />
                    <Text style={styles.actionButtonText}>Ver</Text>
                  </Pressable>
                  
                  <Pressable
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => {
                      console.log('Botão Editar clicado para:', orcamento.nome);
                      editarOrcamento(orcamento);
                    }}
                  >
                    <Ionicons name="create-outline" size={16} color="#fff" />
                    <Text style={styles.actionButtonText}>Editar</Text>
                  </Pressable>
                  
                  <Pressable
                    style={[styles.actionButton, styles.pdfButton]}
                    onPress={() => {
                      console.log('Botão PDF clicado para:', orcamento.nome);
                      exportarOrcamentoPDF(orcamento);
                    }}
                  >
                    <Ionicons name="document-text-outline" size={16} color="#fff" />
                    <Text style={styles.actionButtonText}>PDF</Text>
                  </Pressable>
                  
                  <Pressable
                    style={[styles.actionButton, { backgroundColor: '#9C27B0' }]}
                    onPress={() => {
                      console.log('Botão HTML clicado para:', orcamento.nome);
                      abrirHTMLNoBrowser(orcamento);
                    }}
                  >
                    <Ionicons name="open-outline" size={16} color="#fff" />
                    <Text style={styles.actionButtonText}>HTML</Text>
                  </Pressable>
                  
                  <Pressable
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => {
                      console.log('Botão Excluir clicado para:', orcamento.nome);
                      confirmarRemocao(orcamento);
                    }}
                  >
                    <Ionicons name="trash-outline" size={16} color="#fff" />
                    <Text style={styles.actionButtonText}>Excluir</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal de Detalhes */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedOrcamento?.nome}
              </Text>
              <Pressable
                onPress={() => setShowModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </Pressable>
            </View>
            
            {selectedOrcamento && (
              <ScrollView style={styles.modalContent}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Data:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedOrcamento.dataCreateon).toLocaleDateString('pt-PT')}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Preço Mão de Obra:</Text>
                  <Text style={styles.detailValue}>
                    €{selectedOrcamento.precoMaoObraM2.toFixed(2)}/m²
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Acabamentos:</Text>
                  <Text style={styles.detailValue}>
                    €{selectedOrcamento.acabamentos.toFixed(2)}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Materiais Selecionados:</Text>
                  <Text style={styles.detailValue}>
                    {selectedOrcamento.materiais.filter(m => m.selecionado).length} itens
                  </Text>
                </View>
                
                <View style={[styles.detailRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>TOTAL:</Text>
                  <Text style={styles.totalValue}>
                    €{selectedOrcamento.total.toFixed(2)}
                  </Text>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollView: {
    flex: 1,
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    color: '#ccc',
    marginTop: 20,
    fontWeight: '500',
  },
  emptySubText: {
    fontSize: 14,
    color: '#888',
    marginTop: 10,
    textAlign: 'center',
  },
  orcamentosList: {
    gap: 15,
  },
  orcamentoCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#333',
  },
  orcamentoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orcamentoNome: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  orcamentoTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  orcamentoData: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 15,
  },
  orcamentoActions: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
    flex: 1,
    minWidth: 70,
    cursor: 'pointer',
    // Android-specific styling
    ...Platform.select({
      android: {
        elevation: 4,
        borderWidth: 0,
      },
    }),
  },
  viewButton: {
    backgroundColor: '#4A90E2',
    ...Platform.select({
      android: {
        backgroundColor: '#4A90E2',
        elevation: 4,
      },
    }),
  },
  editButton: {
    backgroundColor: '#28a745',
    ...Platform.select({
      android: {
        backgroundColor: '#28a745',
        elevation: 4,
      },
    }),
  },
  pdfButton: {
    backgroundColor: '#FF6B35',
    ...Platform.select({
      android: {
        backgroundColor: '#FF6B35',
        elevation: 4,
      },
    }),
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    ...Platform.select({
      android: {
        backgroundColor: '#dc3545',
        elevation: 4,
      },
    }),
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    width: '100%',
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#333',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  detailLabel: {
    fontSize: 14,
    color: '#ccc',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  totalRow: {
    backgroundColor: '#2d2d2d',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 10,
    borderRadius: 8,
    borderBottomWidth: 0,
  },
  totalLabel: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    flex: 1,
  },
  totalValue: {
    fontSize: 18,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
}); 