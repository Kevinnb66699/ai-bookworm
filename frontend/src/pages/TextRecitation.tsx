import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Upload, message, List, Typography, Space, Modal, Input, Progress } from 'antd';
import { CameraOutlined, DeleteOutlined, EditOutlined, AudioOutlined, LoadingOutlined, BarChartOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { textRecitationService, TextRecitation as TextRecitationType, RecitationResult } from '../services/textRecitationService';
import { request } from '../services/request';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const TextRecitation: React.FC = () => {
  const [textList, setTextList] = useState<TextRecitationType[]>([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingText, setEditingText] = useState<{ id: number; content: string } | null>(null);
  const [editContent, setEditContent] = useState('');
  const [recording, setRecording] = useState(false);
  const [reciting, setReciting] = useState(false);
  const [currentRecitationId, setCurrentRecitationId] = useState<number | null>(null);
  const [recitationResult, setRecitationResult] = useState<RecitationResult | null>(null);
  const [scoresModalVisible, setScoresModalVisible] = useState(false);
  const [scores, setScores] = useState<{
    current_score: number | null;
    best_score: number | null;
    history: Array<{ score: number; date: string }>;
  } | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const audioContext = useRef<AudioContext | null>(null);

  useEffect(() => {
    fetchTextList();
  }, []);

  const fetchTextList = async () => {
    try {
      const data = await textRecitationService.getTextList();
      setTextList(data);
    } catch (error) {
      message.error('获取课文列表失败');
    }
  };

  const handleUpload: UploadProps['customRequest'] = async ({ file, onSuccess, onError }) => {
    try {
      setLoading(true);
      const newText = await textRecitationService.uploadImage(file as File);
      setTextList(prev => [newText, ...prev]);
      message.success('课文识别成功！');
      onSuccess?.('ok');
    } catch (error) {
      message.error('课文识别失败，请重试');
      onError?.(new Error('上传失败'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await textRecitationService.deleteText(id);
      setTextList(prev => prev.filter(item => item.id !== id));
      message.success('删除成功');
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleEdit = (id: number, content: string) => {
    setEditingText({ id, content });
    setEditContent(content);
    setEditModalVisible(true);
  };

  const handleEditCancel = () => {
    setEditModalVisible(false);
    setEditingText(null);
    setEditContent('');
  };

  const handleEditSubmit = async () => {
    if (!editingText) return;
    
    try {
      const updatedText = await textRecitationService.updateText(editingText.id, editContent);
      setTextList(prev => prev.map(item => 
        item.id === editingText.id ? updatedText : item
      ));
      message.success('更新成功');
      handleEditCancel();
    } catch (error) {
      message.error('更新失败，请重试');
    }
  };

  // 将音频数据转换为WAV格式
  const convertToWav = async (audioData: Blob): Promise<Blob> => {
    const arrayBuffer = await audioData.arrayBuffer();
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // 创建WAV文件头
    const wavHeader = createWavHeader(audioBuffer);
    
    // 获取音频数据
    const audioDataArray = audioBuffer.getChannelData(0);
    const wavData = new Int16Array(audioDataArray.length);
    
    // 转换为16位PCM
    for (let i = 0; i < audioDataArray.length; i++) {
      wavData[i] = Math.max(-1, Math.min(1, audioDataArray[i])) * 0x7FFF;
    }
    
    // 合并WAV头和音频数据
    const wavBlob = new Blob([wavHeader, wavData], { type: 'audio/wav' });
    return wavBlob;
  };

  // 创建WAV文件头
  const createWavHeader = (audioBuffer: AudioBuffer): ArrayBuffer => {
    const numChannels = 1; // 单声道
    const sampleRate = audioBuffer.sampleRate;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = audioBuffer.length * blockAlign;
    
    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);
    
    // RIFF标识
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    
    // fmt子块
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM格式
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    
    // data子块
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);
    
    return buffer;
  };

  // 写入字符串到DataView
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // 开始录音
  const startRecording = async (id: number) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1, // 单声道
          sampleRate: 16000, // 16kHz采样率
          sampleSize: 16 // 16位采样
        }
      });
      
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        const wavBlob = await convertToWav(audioBlob);
        await submitRecitation(wavBlob);
      };

      mediaRecorder.current.start();
      setRecording(true);
      setCurrentRecitationId(id);
      message.success('开始录音');
    } catch (error) {
      message.error('无法访问麦克风');
    }
  };

  // 停止录音
  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
      setRecording(false);
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  // 提交背诵
  const submitRecitation = async (audioBlob: Blob) => {
    if (!currentRecitationId) return;
    
    try {
      setReciting(true);
      const result = await textRecitationService.submitRecitation(currentRecitationId, audioBlob);
      setRecitationResult(result);
      message.success(`背诵评分：${result.score}分`);
    } catch (error) {
      message.error('提交背诵失败');
    } finally {
      setReciting(false);
    }
  };

  // 关闭结果对话框
  const handleResultClose = () => {
    setRecitationResult(null);
    setCurrentRecitationId(null);
  };

  // 获取成绩历史
  const fetchScores = async (id: number) => {
    try {
      const response = await request.get(`/api/text-recitation/${id}/scores`);
      setScores(response.data);
      setScoresModalVisible(true);
    } catch (error) {
      message.error('获取成绩历史失败');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>课文背诵</Title>
      <Card style={{ marginBottom: '24px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>点击下方按钮拍照上传课文图片，系统将自动识别文字内容</Text>
          <Upload
            accept="image/*"
            showUploadList={false}
            customRequest={handleUpload}
            capture="environment"
          >
            <Button
              type="primary"
              icon={<CameraOutlined />}
              loading={loading}
              size="large"
            >
              拍照上传课文
            </Button>
          </Upload>
        </Space>
      </Card>

      <List
        header={<Title level={4}>我的课文列表</Title>}
        bordered
        dataSource={textList}
        renderItem={item => (
          <List.Item
            actions={[
              recording && currentRecitationId === item.id ? (
                <Button
                  type="primary"
                  danger
                  icon={<LoadingOutlined />}
                  onClick={stopRecording}
                >
                  停止录音
                </Button>
              ) : (
                <>
                  <Button
                    type="primary"
                    icon={<AudioOutlined />}
                    onClick={() => startRecording(item.id)}
                    disabled={recording}
                  >
                    开始背诵
                  </Button>
                  <Button
                    type="primary"
                    icon={<BarChartOutlined />}
                    onClick={() => fetchScores(item.id)}
                    style={{ marginLeft: 8 }}
                  >
                    查看成绩
                  </Button>
                </>
              ),
              <Button
                type="text"
                style={{ color: '#1890ff' }}
                icon={<EditOutlined />}
                onClick={() => handleEdit(item.id, item.content)}
              >
                编辑
              </Button>,
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(item.id)}
              >
                删除
              </Button>
            ]}
          >
            <List.Item.Meta
              title={<Text strong>{item.createTime}</Text>}
              description={
                <Paragraph ellipsis={{ rows: 3, expandable: true, symbol: '展开' }}>
                  {item.content}
                </Paragraph>
              }
            />
          </List.Item>
        )}
      />

      <Modal
        title="编辑课文"
        open={editModalVisible}
        onOk={handleEditSubmit}
        onCancel={handleEditCancel}
        okText="保存"
        cancelText="取消"
        width={600}
      >
        <TextArea
          value={editContent}
          onChange={e => setEditContent(e.target.value)}
          rows={10}
          placeholder="请输入课文内容"
        />
      </Modal>

      {/* 背诵结果对话框 */}
      <Modal
        title="背诵结果"
        open={!!recitationResult}
        onOk={handleResultClose}
        onCancel={handleResultClose}
        footer={[
          <Button key="close" type="primary" onClick={handleResultClose}>
            关闭
          </Button>
        ]}
        width={600}
      >
        {recitationResult && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Title level={5}>得分</Title>
              <Progress
                type="circle"
                percent={recitationResult.score}
                status={recitationResult.score >= 80 ? 'success' : 'normal'}
              />
            </div>
            <div>
              <Title level={5}>原文</Title>
              <Paragraph>{recitationResult.original_text}</Paragraph>
            </div>
            <div>
              <Title level={5}>识别结果</Title>
              <Paragraph>{recitationResult.recited_text}</Paragraph>
            </div>
          </Space>
        )}
      </Modal>

      {/* 成绩历史对话框 */}
      <Modal
        title="背诵成绩"
        open={scoresModalVisible}
        onCancel={() => setScoresModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setScoresModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        {scores && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Title level={5}>当前成绩</Title>
              <Progress
                type="circle"
                percent={scores.current_score || 0}
                status={scores.current_score && scores.current_score >= 80 ? 'success' : 'normal'}
              />
            </div>
            <div>
              <Title level={5}>最好成绩</Title>
              <Progress
                type="circle"
                percent={scores.best_score || 0}
                status="success"
              />
            </div>
            <div>
              <Title level={5}>历史记录</Title>
              <List
                dataSource={scores.history}
                renderItem={item => (
                  <List.Item>
                    <Space>
                      <Progress
                        type="circle"
                        percent={item.score}
                        width={40}
                      />
                      <span>{item.date}</span>
                    </Space>
                  </List.Item>
                )}
              />
            </div>
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default TextRecitation; 