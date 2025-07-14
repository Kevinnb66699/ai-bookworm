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
  const reciteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchTextList();
  }, []);

  const fetchTextList = async () => {
    try {
      const data = await textRecitationService.getTextList();
      setTextList(data);
    } catch (error) {
      message.error('Failed to get text list');
    }
  };

  const handleUpload: UploadProps['customRequest'] = async ({ file, onSuccess, onError }) => {
    try {
      setLoading(true);
      const newText = await textRecitationService.uploadImage(file as File);
      setTextList(prev => [newText, ...prev]);
      message.success('Text recognition successful!');
      onSuccess?.('ok');
    } catch (error) {
      message.error('Text recognition failed, please try again');
      onError?.(new Error('Upload failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await textRecitationService.deleteText(id);
      setTextList(prev => prev.filter(item => item.id !== id));
      message.success('Deleted successfully');
    } catch (error) {
      message.error('Failed to delete');
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
      message.success('Updated successfully');
      handleEditCancel();
    } catch (error) {
      message.error('Failed to update, please try again');
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
      // 确保清理之前的状态
      if (mediaRecorder.current) {
        mediaRecorder.current = null;
      }
      audioChunks.current = [];
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1, // 单声道
          sampleRate: 16000, // 16kHz采样率
          sampleSize: 16 // 16位采样
        }
      });
      
      mediaRecorder.current = new MediaRecorder(stream);
      
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.current.onstop = async () => {
        try {
          console.log('Recording stopped, number of audio chunks:', audioChunks.current.length);
          if (audioChunks.current.length === 0) {
            console.error('No recording data');
            message.error('No recording data, please try again');
            setCurrentRecitationId(null);
            return;
          }
          
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
          console.log('Audio Blob size:', audioBlob.size);
          
          const wavBlob = await convertToWav(audioBlob);
          console.log('WAV Blob size:', wavBlob.size);
          
          // 直接传递id参数，避免依赖异步状态更新
          await submitRecitation(wavBlob, id);
        } catch (error) {
          console.error('Failed to process recording data:', error);
          message.error('Failed to process recording, please try again');
          setReciting(false);
          setCurrentRecitationId(null);
        }
      };

      mediaRecorder.current.onerror = (event) => {
        console.error('Recording error:', event);
        message.error('An error occurred during recording');
        setRecording(false);
        setCurrentRecitationId(null);
      };

      mediaRecorder.current.start();
      setRecording(true);
      setCurrentRecitationId(id);
      message.success('Started recording');
    } catch (error) {
      console.error('Failed to start recording:', error);
      message.error('Microphone access failed');
      setRecording(false);
      setCurrentRecitationId(null);
    }
  };

  // 停止录音
  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
      setRecording(false);
      // 清理媒体流
      if (mediaRecorder.current.stream) {
        mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  // 提交背诵 - 添加可选的id参数
  const submitRecitation = async (audioBlob: Blob, recitationId?: number) => {
    const targetId = recitationId || currentRecitationId;
    
    if (!targetId) {
      console.error('No current recitation ID');
      return;
    }
    
    try {
      setReciting(true);
      console.log('Starting recitation submission, ID:', targetId);
      
      // 显示处理中的提示
      const hideLoading = message.loading('Processing your recitation, please wait...', 0);
      
      // 10秒超时定时器
      if (reciteTimeoutRef.current) clearTimeout(reciteTimeoutRef.current);
      reciteTimeoutRef.current = setTimeout(() => {
        hideLoading();
        setReciting(false);
        setCurrentRecitationId(null);
        message.error('Recitation submission timed out');
      }, 10000);
      
      const result = await textRecitationService.submitRecitation(targetId, audioBlob);
      
      if (reciteTimeoutRef.current) clearTimeout(reciteTimeoutRef.current);
      hideLoading();
      
      setRecitationResult(result);
      
      // 根据得分给出不同的反馈
      if (result.score >= 80) {
        message.success(`Recitation score: ${result.score} points - Great job!`);
      } else if (result.score >= 60) {
        message.success(`Recitation score: ${result.score} points - Good job!`);
      } else {
        message.info(`Recitation score: ${result.score} points - Keep practicing!`);
      }
      
    } catch (error) {
      if (reciteTimeoutRef.current) clearTimeout(reciteTimeoutRef.current);
      console.error('Recitation submission failed:', error);
      message.error('Recitation submission failed, please try again');
    } finally {
      setReciting(false);
      // 确保清理当前背诵ID，无论成功还是失败
      setCurrentRecitationId(null);
    }
  };

  // 关闭结果对话框
  const handleResultClose = () => {
    setRecitationResult(null);
    // currentRecitationId 已经在 submitRecitation 中清理了，这里不需要重复清理
  };

  // 获取成绩历史
  const fetchScores = async (id: number) => {
    try {
      const response = await request.get(`/api/text-recitation/${id}/scores`);
      setScores(response.data);
      setScoresModalVisible(true);
    } catch (error) {
      message.error('Failed to get score history');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Text Recitation</Title>
      <Card style={{ marginBottom: '24px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>Click the button below to take a photo and upload text images. The system will automatically recognize the text content.</Text>
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
              Take Photo & Upload Text
            </Button>
          </Upload>
        </Space>
      </Card>

      <List
        header={<Title level={4}>My Text List</Title>}
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
                  size="large"
                >
                  Stop Recording
                </Button>
              ) : reciting && currentRecitationId === item.id ? (
                <Button
                  type="primary"
                  icon={<LoadingOutlined />}
                  loading={true}
                  disabled={true}
                  size="large"
                >
                  Processing...
                </Button>
              ) : (
                <>
                  <Button
                    type="primary"
                    icon={<AudioOutlined />}
                    onClick={() => startRecording(item.id)}
                    disabled={recording || reciting}
                    size="large"
                  >
                    Start Recitation
                  </Button>
                  <Button
                    type="primary"
                    icon={<BarChartOutlined />}
                    onClick={() => fetchScores(item.id)}
                    style={{ marginLeft: 8 }}
                  >
                    View Scores
                  </Button>
                </>
              ),
              <Button
                type="text"
                style={{ color: '#1890ff' }}
                icon={<EditOutlined />}
                onClick={() => handleEdit(item.id, item.content)}
              >
                Edit
              </Button>,
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(item.id)}
              >
                Delete
              </Button>
            ]}
          >
            <List.Item.Meta
              title={<Text strong>{item.createTime}</Text>}
              description={
                <Paragraph ellipsis={{ rows: 3, expandable: true, symbol: 'Expand' }}>
                  {item.content}
                </Paragraph>
              }
            />
          </List.Item>
        )}
      />

      <Modal
        title="Edit Text"
        open={editModalVisible}
        onOk={handleEditSubmit}
        onCancel={handleEditCancel}
        okText="Save"
        cancelText="Cancel"
        width={600}
      >
        <TextArea
          value={editContent}
          onChange={e => setEditContent(e.target.value)}
          rows={10}
          placeholder="Please enter the text content"
        />
      </Modal>

      {/* Recitation Result Dialog */}
      <Modal
        title="Recitation Result"
        open={!!recitationResult}
        onOk={handleResultClose}
        onCancel={handleResultClose}
        footer={[
          <Button key="close" type="primary" onClick={handleResultClose}>
            Close
          </Button>
        ]}
        width={600}
      >
        {recitationResult && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Title level={5}>Score</Title>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <Progress
                  type="circle"
                  percent={recitationResult.score}
                  status={recitationResult.score >= 80 ? 'success' : 'normal'}
                />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '48px', 
                    fontWeight: 'bold', 
                    color: recitationResult.score >= 80 ? '#52c41a' : recitationResult.score >= 60 ? '#faad14' : '#ff4d4f',
                    lineHeight: 1
                  }}>
                    {recitationResult.score}
                  </div>
                  <div style={{ 
                    fontSize: '16px', 
                    color: '#666',
                    marginTop: '4px'
                  }}>
                    points
                  </div>
                </div>
              </div>
            </div>
            <div>
              <Title level={5}>Original Text</Title>
              <Paragraph>{recitationResult.original_text}</Paragraph>
            </div>
            <div>
              <Title level={5}>Recognition Result</Title>
              <Paragraph>{recitationResult.recited_text}</Paragraph>
            </div>
          </Space>
        )}
      </Modal>

      {/* Score History Dialog */}
      <Modal
        title="Recitation Scores"
        open={scoresModalVisible}
        onCancel={() => setScoresModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setScoresModalVisible(false)}>
            Close
          </Button>
        ]}
        width={600}
      >
        {scores && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Title level={5}>Current Score</Title>
              <Progress
                type="circle"
                percent={scores.current_score || 0}
                status={scores.current_score && scores.current_score >= 80 ? 'success' : 'normal'}
              />
            </div>
            <div>
              <Title level={5}>Best Score</Title>
              <Progress
                type="circle"
                percent={scores.best_score || 0}
                status="success"
              />
            </div>
            <div>
              <Title level={5}>History</Title>
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