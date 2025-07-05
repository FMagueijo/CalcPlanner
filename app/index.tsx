import * as Print from 'expo-print';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useOrcamentos } from './hooks/useOrcamentos';
import { ItemOrcamento } from './types';

export default function Index() {
  const { 
    materiais, 
    loading, 
    orcamentoParaEditar,
    atualizarPrecoMaterial, 
    calcularTotal, 
    criarOrcamento,
    limparOrcamentoParaEditar
  } = useOrcamentos();
  
  const [nomeOrcamento, setNomeOrcamento] = useState('');
  const [itensOrcamento, setItensOrcamento] = useState<ItemOrcamento[]>(
    materiais.map(material => ({
      materialId: material.id,
      quantidade: 0,
      selecionado: false
    }))
  );
  const [precoMaoObraM2, setPrecoMaoObraM2] = useState('');
  const [acabamentos, setAcabamentos] = useState('');
  const [editandoPrecos, setEditandoPrecos] = useState(false);

  // Carregar orçamento para edição quando disponível
  useEffect(() => {
    if (orcamentoParaEditar) {
      setNomeOrcamento(orcamentoParaEditar.nome);
      setItensOrcamento(orcamentoParaEditar.materiais);
      setPrecoMaoObraM2(orcamentoParaEditar.precoMaoObraM2.toString());
      setAcabamentos(orcamentoParaEditar.acabamentos.toString());
      
      // Limpar o orçamento para edição após carregar
      limparOrcamentoParaEditar();
    }
  }, [orcamentoParaEditar, limparOrcamentoParaEditar]);

  // Atualizar itens quando materiais mudarem
  useEffect(() => {
    if (!orcamentoParaEditar) {
      setItensOrcamento(
        materiais.map(material => ({
          materialId: material.id,
          quantidade: 0,
          selecionado: false
        }))
      );
    }
  }, [materiais, orcamentoParaEditar]);

  const limparFormulario = () => {
    setNomeOrcamento('');
    setItensOrcamento(
      materiais.map(material => ({
        materialId: material.id,
        quantidade: 0,
        selecionado: false
      }))
    );
    setPrecoMaoObraM2('');
    setAcabamentos('');
  };

  const atualizarQuantidade = (materialId: string, quantidade: string) => {
    const qtd = parseFloat(quantidade) || 0;
    setItensOrcamento(prev =>
      prev.map(item =>
        item.materialId === materialId
          ? { ...item, quantidade: qtd }
          : item
      )
    );
  };

  const toggleSelecionado = (materialId: string) => {
    setItensOrcamento(prev =>
      prev.map(item =>
        item.materialId === materialId
          ? { ...item, selecionado: !item.selecionado }
          : item
      )
    );
  };

  const totalOrcamento = calcularTotal(
    itensOrcamento,
    parseFloat(precoMaoObraM2) || 0,
    parseFloat(acabamentos) || 0
  );

  const gerarOrcamento = () => {
    if (!nomeOrcamento.trim()) {
      Alert.alert('Erro', 'Digite um nome para o orçamento');
      return;
    }

    // Verificar se há pelo menos um material selecionado
    const materiaisSelecionados = itensOrcamento.filter(item => item.selecionado);
    if (materiaisSelecionados.length === 0) {
      Alert.alert('Erro', 'Selecione pelo menos um material');
      return;
    }

    // Verificar se há quantidade nos materiais selecionados
    const materiaisComQuantidade = materiaisSelecionados.filter(item => item.quantidade > 0);
    if (materiaisComQuantidade.length === 0) {
      Alert.alert('Erro', 'Digite a quantidade para pelo menos um material selecionado');
      return;
    }

    try {
      const orcamento = criarOrcamento({
        nome: nomeOrcamento,
        materiais: itensOrcamento,
        precoMaoObraM2: parseFloat(precoMaoObraM2) || 0,
        acabamentos: parseFloat(acabamentos) || 0
      });

      Alert.alert('Sucesso', `Orçamento "${orcamento.nome}" criado com sucesso!`);
      limparFormulario();
    } catch (error) {
      console.error('Erro ao criar orçamento:', error);
      Alert.alert('Erro', 'Erro ao criar orçamento. Tente novamente.');
    }
  };

  const gerarHTMLOrcamento = () => {
    const itensDetalhados = itensOrcamento
      .filter(item => item.selecionado)
      .map(item => {
        const material = materiais.find(m => m.id === item.materialId);
        return {
          ...item,
          material,
          subtotal: material ? material.precoMetroQuadrado * item.quantidade : 0,
          maoObra: (parseFloat(precoMaoObraM2) || 0) * item.quantidade
        };
      });

    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Orçamento - ${nomeOrcamento}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      h1 { color: #333; text-align: center; }
      table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background-color: #f2f2f2; }
      .total { font-size: 18px; font-weight: bold; text-align: right; margin: 20px 0; }
    </style>
  </head>
  <body>
    <h1>Orçamento: ${nomeOrcamento}</h1>
    <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-PT')}</p>
    
    <h2>Materiais</h2>
    <table>
      <tr>
        <th>Material</th>
        <th>Quantidade (m²)</th>
        <th>Preço/m²</th>
        <th>Subtotal</th>
      </tr>
      ${itensDetalhados.map(item => `
        <tr>
          <td>${item.material?.nome || 'N/A'}</td>
          <td>${item.quantidade}</td>
          <td>€${item.material?.precoMetroQuadrado.toFixed(2) || '0.00'}</td>
          <td>€${item.subtotal.toFixed(2)}</td>
        </tr>
      `).join('')}
    </table>
    
    <h2>Mão de Obra</h2>
    <table>
      <tr>
        <th>Material</th>
        <th>Quantidade (m²)</th>
        <th>Preço/m²</th>
        <th>Subtotal</th>
      </tr>
      ${itensDetalhados.map(item => `
        <tr>
          <td>${item.material?.nome || 'N/A'}</td>
          <td>${item.quantidade}</td>
          <td>€${(parseFloat(precoMaoObraM2) || 0).toFixed(2)}</td>
          <td>€${item.maoObra.toFixed(2)}</td>
        </tr>
      `).join('')}
    </table>
    
    <h2>Resumo</h2>
    <table>
      <tr>
        <td><strong>Total Materiais:</strong></td>
        <td>€${itensDetalhados.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)}</td>
      </tr>
      <tr>
        <td><strong>Total Mão de Obra:</strong></td>
        <td>€${itensDetalhados.reduce((sum, item) => sum + item.maoObra, 0).toFixed(2)}</td>
      </tr>
      <tr>
        <td><strong>Acabamentos:</strong></td>
        <td>€${(parseFloat(acabamentos) || 0).toFixed(2)}</td>
      </tr>
      <tr style="background-color: #f2f2f2;">
        <td><strong>TOTAL GERAL:</strong></td>
        <td><strong>€${totalOrcamento.toFixed(2)}</strong></td>
      </tr>
    </table>
  </body>
</html>`;
  };

  const exportarPDF = async () => {
    if (!nomeOrcamento.trim()) {
      Alert.alert('Erro', 'Digite um nome para o orçamento antes de exportar');
      return;
    }

    const html = gerarHTMLOrcamento();
    try {
      await Print.printAsync({
        html: html,
      });
    } catch (error) {
      Alert.alert('Erro', 'Erro ao gerar PDF');
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
        <Text style={styles.title}>Orçamentos de Construção</Text>
        
        {orcamentoParaEditar && (
          <View style={styles.editingBanner}>
            <Text style={styles.editingText}>
              ✏️ Editando orçamento: {orcamentoParaEditar.nome}
            </Text>
          </View>
        )}
        
        {/* Nome do Orçamento */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nome do Orçamento</Text>
          <TextInput
            style={styles.input}
            value={nomeOrcamento}
            onChangeText={setNomeOrcamento}
            placeholder="Ex: Casa João Silva"
            placeholderTextColor="#999"
          />
        </View>

        {/* Toggle para editar preços */}
        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>Editar Preços dos Materiais</Text>
          <Switch
            value={editandoPrecos}
            onValueChange={setEditandoPrecos}
            trackColor={{ false: "#444", true: "#4A90E2" }}
            thumbColor={editandoPrecos ? "#fff" : "#ccc"}
            ios_backgroundColor="#444"
          />
        </View>

        {/* Lista de Materiais */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Materiais</Text>
          {materiais.map(material => {
            const item = itensOrcamento.find(i => i.materialId === material.id);
            return (
              <View key={material.id} style={styles.materialItem}>
                <View style={styles.materialHeader}>
                  <Switch
                    value={item?.selecionado || false}
                    onValueChange={() => toggleSelecionado(material.id)}
                    trackColor={{ false: "#444", true: "#4A90E2" }}
                    thumbColor={item?.selecionado ? "#fff" : "#ccc"}
                    ios_backgroundColor="#444"
                  />
                  <Text style={styles.materialName}>{material.nome}</Text>
                </View>
                
                <View style={styles.materialInputs}>
                  {editandoPrecos && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Preço/m²:</Text>
                      <TextInput
                        style={styles.smallInput}
                        value={material.precoMetroQuadrado.toString()}
                        onChangeText={(value) => {
                          const novoPreco = parseFloat(value) || 0;
                          atualizarPrecoMaterial(material.id, novoPreco);
                        }}
                        keyboardType="numeric"
                        placeholder="0.00"
                        placeholderTextColor="#999"
                      />
                      <Text style={styles.currency}>€</Text>
                    </View>
                  )}
                  
                  {!editandoPrecos && (
                    <Text style={styles.priceDisplay}>
                      Preço: €{material.precoMetroQuadrado.toFixed(2)}/m²
                    </Text>
                  )}
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Quantidade (m²):</Text>
                    <TextInput
                      style={styles.smallInput}
                      value={item?.quantidade.toString() || '0'}
                      onChangeText={(value) => atualizarQuantidade(material.id, value)}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#999"
                      editable={item?.selecionado}
                    />
                  </View>
                </View>
                
                {item?.selecionado && item.quantidade > 0 && (
                  <Text style={styles.subtotal}>
                    Subtotal: €{(material.precoMetroQuadrado * item.quantidade).toFixed(2)}
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        {/* Mão de Obra */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mão de Obra</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Preço por m²:</Text>
            <TextInput
              style={styles.input}
              value={precoMaoObraM2}
              onChangeText={setPrecoMaoObraM2}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor="#999"
            />
            <Text style={styles.currency}>€</Text>
          </View>
        </View>

        {/* Acabamentos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acabamentos</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Valor total:</Text>
            <TextInput
              style={styles.input}
              value={acabamentos}
              onChangeText={setAcabamentos}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor="#999"
            />
            <Text style={styles.currency}>€</Text>
          </View>
        </View>

        {/* Total */}
        <View style={styles.totalContainer}>
          <Text style={styles.totalText}>
            TOTAL: €{totalOrcamento.toFixed(2)}
          </Text>
        </View>

        {/* Botões */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={gerarOrcamento}>
            <Text style={styles.buttonText}>Salvar Orçamento</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.button, styles.pdfButton]} onPress={exportarPDF}>
            <Text style={styles.buttonText}>Exportar PDF</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={limparFormulario}>
            <Text style={styles.buttonText}>Limpar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  editingBanner: {
    backgroundColor: '#2d2d2d',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  editingText: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#333',
  },
  toggleLabel: {
    fontSize: 16,
    color: '#fff',
    flex: 1,
  },
  materialItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 15,
    marginBottom: 15,
  },
  materialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  materialName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 10,
    flex: 1,
  },
  materialInputs: {
    marginLeft: 50,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 14,
    color: '#ccc',
    width: 120,
  },
  input: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    fontSize: 16,
    color: '#fff',
    backgroundColor: '#2a2a2a',
  },
  smallInput: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    padding: 8,
    width: 80,
    fontSize: 14,
    color: '#fff',
    backgroundColor: '#2a2a2a',
    textAlign: 'center',
  },
  currency: {
    fontSize: 14,
    color: '#ccc',
    marginLeft: 5,
  },
  priceDisplay: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '500',
    marginBottom: 10,
  },
  subtotal: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: 'bold',
    marginTop: 5,
    marginLeft: 50,
  },
  totalContainer: {
    backgroundColor: '#6366f1', // Indigo
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  totalText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  buttonContainer: {
    gap: 15,
    paddingBottom: 30,
  },
  button: {
    backgroundColor: '#6366f1', // Indigo
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    // Android-specific styling
    ...Platform.select({
      android: {
        backgroundColor: '#6366f1',
        elevation: 8,
        borderWidth: 0,
      },
    }),
  },
  pdfButton: {
    backgroundColor: '#f59e0b', // Amber
    shadowColor: '#f59e0b',
    ...Platform.select({
      android: {
        backgroundColor: '#f59e0b',
        elevation: 8,
      },
    }),
  },
  clearButton: {
    backgroundColor: '#ef4444', // Red
    shadowColor: '#ef4444',
    ...Platform.select({
      android: {
        backgroundColor: '#ef4444',
        elevation: 8,
      },
    }),
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});