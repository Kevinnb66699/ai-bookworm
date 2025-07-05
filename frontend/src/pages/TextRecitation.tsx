import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Upload, message, List, Typography, Space, Modal, Input, Progress } from 'antd';
import { CameraOutlined, DeleteOutlined, EditOutlined, AudioOutlined, LoadingOutlined, BarChartOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { textRecitationService, TextRecitation as TextRecitationType, RecitationResult } from '../services/textRecitationService';
import { request } from '../services/request';
import { useAuth } from '../context/AuthContext';
import './TextRecitation.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete, isRecording, setIsRecording }) => {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  useEffect(() => {
    const initRecorder = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            setAudioChunks(prev => [...prev, event.data]);
          }
        };
        
        recorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          onRecordingComplete(audioBlob);
          setAudioChunks([]);
        };
        
        setMediaRecorder(recorder);
      } catch (error) {
        console.error('获取麦克风权限失败:', error);
      }
    };

    initRecorder();
  }, [audioChunks, onRecordingComplete]);

  const startRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'inactive') {
      setAudioChunks([]);
      mediaRecorder.start();
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="audio-recorder">
      <button 
        onClick={isRecording ? stopRecording : startRecording}
        className={`record-button ${isRecording ? 'recording' : ''}`}
      >
        {isRecording ? '停止录音' : '开始录音'}
      </button>
    </div>
  );
};

const TextRecitation: React.FC = () => {
  // 认证状态检查
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const [authStatus, setAuthStatus] = useState<string>('检查中...');
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (authLoading) {
      setAuthStatus('认证检查中...');
    } else if (!isLoggedIn) {
      setAuthStatus('未登录 - 请先登录');
    } else if (!token) {
      setAuthStatus('Token缺失 - 请重新登录');
    } else {
      setAuthStatus(`已登录 - 用户: ${user?.username || '未知'}`);
    }
  }, [user, isLoggedIn, authLoading]);

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
          console.log('录音停止，音频块数量:', audioChunks.current.length);
          if (audioChunks.current.length === 0) {
            console.error('没有录音数据');
            message.error('没有录音数据，请重试');
            setCurrentRecitationId(null);
            return;
          }
          
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
          console.log('音频Blob大小:', audioBlob.size);
          
          const wavBlob = await convertToWav(audioBlob);
          console.log('WAV Blob大小:', wavBlob.size);
          
          // 直接传递id参数，避免依赖异步状态更新
          await submitRecitation(wavBlob, id);
        } catch (error) {
          console.error('处理录音数据失败:', error);
          message.error('处理录音失败，请重试');
          setReciting(false);
          setCurrentRecitationId(null);
        }
      };

      mediaRecorder.current.onerror = (event) => {
        console.error('录音错误:', event);
        message.error('录音过程中出现错误');
        setRecording(false);
        setCurrentRecitationId(null);
      };

      mediaRecorder.current.start();
      setRecording(true);
      setCurrentRecitationId(id);
      message.success('开始录音');
    } catch (error) {
      console.error('启动录音失败:', error);
      message.error('无法访问麦克风');
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
      console.error('没有当前背诵ID');
      return;
    }
    
    try {
      setReciting(true);
      console.log('开始提交背诵，ID:', targetId);
      
      // 显示处理中的提示
      const hideLoading = message.loading('正在处理您的背诵，请稍候...', 0);
      
      const result = await textRecitationService.submitRecitation(targetId, audioBlob);
      
      // 隐藏加载提示
      hideLoading();
      
      setRecitationResult(result);
      
      // 根据得分给出不同的反馈
      if (result.score >= 80) {
        message.success(`背诵评分：${result.score}分 - 太棒了！`);
      } else if (result.score >= 60) {
        message.success(`背诵评分：${result.score}分 - 不错哦！`);
      } else {
        message.info(`背诵评分：${result.score}分 - 继续努力！`);
      }
      
    } catch (error) {
      console.error('提交背诵失败:', error);
      message.error('提交背诵失败，请重试');
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
      message.error('获取成绩历史失败');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* 认证状态显示 */}
      <Card style={{ marginBottom: '16px' }}>
        <Space>
          <Text strong>认证状态：</Text>
          <Text style={{ 
            color: isLoggedIn ? '#52c41a' : '#ff4d4f',
            fontWeight: 'bold'
          }}>
            {authStatus}
          </Text>
          {!isLoggedIn && (
            <Button type="link" onClick={() => window.location.href = '/login'}>
              前往登录
            </Button>
          )}
        </Space>
      </Card>

      <Title level={2}>课文背诵</Title>
      <Card style={{ marginBottom: '24px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>点击下方按钮拍照上传课文图片，系统将自动识别文字内容</Text>
          <Upload
            accept="image/*"
            showUploadList={false}
            customRequest={handleUpload}
            capture="environment"
            disabled={!isLoggedIn}
          >
            <Button
              type="primary"
              icon={<CameraOutlined />}
              loading={loading}
              size="large"
              disabled={!isLoggedIn}
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
                  size="large"
                >
                  停止录音
                </Button>
              ) : reciting && currentRecitationId === item.id ? (
                <Button
                  type="primary"
                  icon={<LoadingOutlined />}
                  loading={true}
                  disabled={true}
                  size="large"
                >
                  正在处理...
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
                    分
                  </div>
                </div>
              </div>
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