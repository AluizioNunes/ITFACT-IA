import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Divider, Row, Col, Input, Button, Tag, Tabs, Form, Select, Slider } from 'antd';
import { RobotOutlined, SendOutlined, SettingOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { containerVariants, cardVariants, buttonVariants } from '../ui/animations';

type ChatMessage = { role: 'user' | 'model'; text: string };

const DEFAULT_MODEL = 'gemini-1.5-pro-latest';

const IA: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [model, setModel] = useState<string>(DEFAULT_MODEL);
  const [temperature, setTemperature] = useState<number>(0.7);
  const [topP, setTopP] = useState<number>(0.9);
  const [topK, setTopK] = useState<number>(40);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [sending, setSending] = useState(false);

  // Carregar configuração do localStorage e .env
  useEffect(() => {
    const envKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
    const savedKey = localStorage.getItem('ia.apiKey');
    const useKey = savedKey || envKey || '';
    setApiKey(useKey);
    const savedModel = localStorage.getItem('ia.model');
    const normalize = (m: string) => {
      if (!m) return DEFAULT_MODEL;
      if (m.endsWith('-latest')) return m;
      if (m === 'gemini-1.5-pro' || m === 'gemini-1.5-flash') return `${m}-latest`;
      return m;
    };
    if (savedModel) setModel(normalize(savedModel));
    const savedTemp = localStorage.getItem('ia.temperature');
    if (savedTemp) setTemperature(parseFloat(savedTemp));
    const savedTopP = localStorage.getItem('ia.topP');
    if (savedTopP) setTopP(parseFloat(savedTopP));
    const savedTopK = localStorage.getItem('ia.topK');
    if (savedTopK) setTopK(parseInt(savedTopK));
  }, []);

  // Usa proxy backend FastAPI; durante desenvolvimento, acessa diretamente a porta mapeada 8001
  const endpoint = useMemo(() => `http://localhost:8001/ai/gemini/chat?model=${model}`, [model]);

  const sendMessage = useCallback(async () => {
    if (!input.trim()) return;
    const userText = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setInput('');
    setSending(true);
    try {
      const body = {
        contents: [
          {
            role: 'user',
            parts: [{ text: userText }],
          },
        ],
        generationConfig: {
          temperature,
          topP,
          topK,
        },
      };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }
      const data = await res.json();
      // Gemini v1beta response: candidates[0].content.parts[*].text
      const candidate = data?.candidates?.[0];
      const parts = candidate?.content?.parts || [];
      const text = parts.map((p: any) => p.text).join('\n');
      setMessages(prev => [...prev, { role: 'model', text: text || '[Sem resposta]' }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'model', text: `Erro: ${e?.message || e}` }]);
    } finally {
      setSending(false);
    }
  }, [input, apiKey, endpoint, temperature, topP, topK]);

  const saveConfig = () => {
    localStorage.setItem('ia.apiKey', apiKey);
    localStorage.setItem('ia.model', model);
    localStorage.setItem('ia.temperature', temperature.toString());
    localStorage.setItem('ia.topP', topP.toString());
    localStorage.setItem('ia.topK', topK.toString());
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <Divider orientation="left">IA Tools</Divider>
      <Tabs
        defaultActiveKey="chat"
        items={[
          {
            key: 'chat',
            label: (
              <span>
                <RobotOutlined /> Chat
              </span>
            ),
            children: (
              <Row gutter={[16, 16]}>
                <Col span={16}>
                  <motion.div variants={cardVariants} whileHover="hover">
                    <Card title="Conversa com Gemini" extra={<Tag color={'geekblue'}>Proxy backend</Tag>}>
                      <div style={{ maxHeight: 420, overflowY: 'auto', marginBottom: 12, border: '1px solid #eee', padding: 12, borderRadius: 6 }}>
                        {messages.length === 0 && (
                          <div style={{ color: '#888' }}>Digite uma mensagem para começar.</div>
                        )}
                        {messages.map((m, idx) => (
                          <div key={idx} style={{ marginBottom: 8 }}>
                            <Tag color={m.role === 'user' ? 'blue' : 'gold'}>{m.role === 'user' ? 'Você' : 'IA'}</Tag>
                            <span style={{ whiteSpace: 'pre-wrap' }}>{m.text}</span>
                          </div>
                        ))}
                      </div>
                      <Input.TextArea rows={3} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Escreva sua pergunta..." />
                      <motion.div variants={buttonVariants} initial="hidden" animate="visible" style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                        <Button type="primary" icon={<SendOutlined />} loading={sending} onClick={sendMessage}>Enviar</Button>
                        <Button onClick={() => setMessages([])} disabled={sending}>Limpar</Button>
                      </motion.div>
                    </Card>
                  </motion.div>
                </Col>
                <Col span={8}>
                  <motion.div variants={cardVariants} whileHover="hover">
                    <Card title="Resumo da Sessão">
                      <p><strong>Modelo:</strong> {model}</p>
                      <p><strong>Temperatura:</strong> {temperature}</p>
                      <p><strong>Mensagens:</strong> {messages.length}</p>
                    </Card>
                  </motion.div>
                </Col>
              </Row>
            )
          },
          {
            key: 'admin',
            label: (
              <span>
                <SettingOutlined /> Administração
              </span>
            ),
            children: (
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <motion.div variants={cardVariants} whileHover="hover">
                    <Card title="Configuração de IA">
                      <Form layout="vertical">
                        <Form.Item label="API Key">
                          <Input value={apiKey} disabled placeholder="Gerenciado pelo servidor (proxy)" />
                        </Form.Item>
                        <Form.Item label="Modelo">
                          <Select value={model} onChange={setModel}
                            options={[
                              { value: 'gemini-1.5-pro-latest', label: 'gemini-1.5-pro-latest' },
                              { value: 'gemini-1.5-flash-latest', label: 'gemini-1.5-flash-latest' },
                            ]}
                          />
                        </Form.Item>
                        <Form.Item label={`Temperatura (${temperature.toFixed(2)})`}>
                          <Slider min={0} max={1} step={0.05} value={temperature} onChange={setTemperature} />
                        </Form.Item>
                        <Form.Item label={`topP (${topP.toFixed(2)})`}>
                          <Slider min={0} max={1} step={0.05} value={topP} onChange={setTopP} />
                        </Form.Item>
                        <Form.Item label={`topK (${topK})`}>
                          <Slider min={1} max={100} step={1} value={topK} onChange={setTopK} />
                        </Form.Item>
                      </Form>
                      <motion.div variants={buttonVariants} initial="hidden" animate="visible" style={{ display: 'flex', gap: 8 }}>
                        <Button type="primary" onClick={saveConfig}>Salvar</Button>
                        <Button onClick={() => { localStorage.removeItem('ia.apiKey'); localStorage.removeItem('ia.model'); localStorage.removeItem('ia.temperature'); localStorage.removeItem('ia.topP'); localStorage.removeItem('ia.topK'); }}>Reset Local</Button>
                      </motion.div>
                    </Card>
                  </motion.div>
                </Col>
              </Row>
            )
          }
        ]}
      />
    </motion.div>
  );
};

export default IA;