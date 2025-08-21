import React, { useEffect, useState, useRef } from 'react';
import { Card, Upload, Button, Space, Typography, message } from 'antd';
import { UploadOutlined, SoundOutlined, CheckCircleTwoTone, AudioOutlined, LoadingOutlined, StopOutlined } from '@ant-design/icons';
import { parentVoiceService } from '../services/parentVoiceService';

const { Title, Text } = Typography;

// ===== 与课文背诵页一致的 WAV 转换工具 =====
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

  const writeString = (v: DataView, offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      v.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // fmt 
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  return buffer;
};

const convertToWav = async (audioData: Blob): Promise<Blob> => {
  const arrayBuffer = await audioData.arrayBuffer();
  const audioContext = new AudioContext();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const wavHeader = createWavHeader(audioBuffer);
  const audioDataArray = audioBuffer.getChannelData(0);
  const wavData = new Int16Array(audioDataArray.length);

  for (let i = 0; i < audioDataArray.length; i++) {
    wavData[i] = Math.max(-1, Math.min(1, audioDataArray[i])) * 0x7FFF;
  }

  return new Blob([wavHeader, wavData], { type: 'audio/wav' });
};

const ParentVoice: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [voiceStyle, setVoiceStyle] = useState<any>(null);
  const [recording, setRecording] = useState(false);
  const [hasVoiceStyle, setHasVoiceStyle] = useState<boolean>(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const examplePhrases = [
    '宝贝，这次背诵做得很棒，妈妈为你骄傲。',
    '今天进步很大，再把第二段放慢一点点就更好了。',
    '别着急，按照自己的节奏来，我们一起加油。',
    '再试一次，妈妈相信你能行！'
  ];

  const formatTime = (s: string | null) => {
    if (!s) return '';
    try {
      const d = new Date(s); // s 是带Z的UTC时间
      // 直接以本地时区显示（浏览器会按系统时区渲染）
      const local = d;
      const pad = (n: number) => String(n).padStart(2, '0');
      const y = local.getFullYear();
      const m = pad(local.getMonth() + 1);
      const day = pad(local.getDate());
      const hh = pad(local.getHours());
      const mm = pad(local.getMinutes());
      const ss = pad(local.getSeconds());
      return `${y}/${m}/${day} ${hh}:${mm}:${ss}`;
    } catch {
      return s;
    }
  };

  useEffect(() => {
    // 进入页面时查询状态
    (async () => {
      try {
        const status = await parentVoiceService.getStatus();
        setHasVoiceStyle(status.has_voice_style);
        setVoiceStyle(status.voice_style || null);
        setAudioUrl(status.audio_sample_url || null);
        setLastUpdatedAt(status.updated_at || null);
      } catch {
        // ignore
      }
    })();
  }, []);

  const beforeUpload = (file: File) => {
    const ok = file.type === 'audio/wav' || file.name.toLowerCase().endsWith('.wav');
    if (!ok) {
      message.error('请上传 WAV 音频文件（单声道/16kHz/16bit）');
    }
    return ok || Upload.LIST_IGNORE;
  };

  const handleCustomUpload = async (options: any) => {
    const { file, onError, onSuccess } = options;
    try {
      setUploading(true);
      const resp = await parentVoiceService.upload(file as File);
      setAudioUrl(resp.audio_sample_url);
      message.success('音色样本上传成功');
      onSuccess?.('ok');
    } catch (e) {
      message.error('上传失败');
      onError?.(e);
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);
      const resp = await parentVoiceService.analyze();
      setVoiceStyle(resp.voice_style);
      // 成功后刷新状态，确保右上角“已建模”即时更新
      try {
        const status = await parentVoiceService.getStatus();
        setHasVoiceStyle(status.has_voice_style);
        setLastUpdatedAt(status.updated_at || null);
      } catch {}
      message.success('音色分析完成');
    } catch (e) {
      message.error('分析失败');
    } finally {
      setAnalyzing(false);
    }
  };

  const startRecording = async () => {
    try {
      audioChunks.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, sampleRate: 16000, sampleSize: 16 } });
      mediaRecorder.current = new MediaRecorder(stream);
      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };
      mediaRecorder.current.onstop = async () => {
        try {
          const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
          // 转为 WAV 再上传（与课文背诵一致）
          const wavBlob = await convertToWav(blob);
          const wavFile = new File([wavBlob], 'parent_voice.wav', { type: 'audio/wav' });
          const resp = await parentVoiceService.upload(wavFile);
          setAudioUrl(resp.audio_sample_url);
          message.success('录音已上传');
        } catch (err) {
          message.error('录音处理失败');
        }
      };
      mediaRecorder.current.start();
      setRecording(true);
      message.success('开始录音');
    } catch (e) {
      message.error('无法访问麦克风');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
      setRecording(false);
      if (mediaRecorder.current.stream) {
        mediaRecorder.current.stream.getTracks().forEach(t => t.stop());
      }
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}><SoundOutlined /> 家长音色设置</Title>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="上传音色样本">
          <Space direction="vertical">
            <Upload showUploadList={false} beforeUpload={beforeUpload} customRequest={handleCustomUpload}>
              <Button icon={<UploadOutlined />} loading={uploading}>
                选择音频（仅 WAV）
              </Button>
            </Upload>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <Space>
                {recording ? (
                  <Button type="primary" danger icon={<StopOutlined />} onClick={stopRecording}>
                    停止录音
                  </Button>
                ) : (
                  <Button type="primary" icon={<AudioOutlined />} onClick={startRecording}>
                    开始录音
                  </Button>
                )}
              </Space>
              <div style={{ maxWidth: 420 }}>
                <Text type="secondary">推荐示例词（可照读）：</Text>
                <div>
                  {examplePhrases.map((s, i) => (
                    <div key={i} style={{ fontSize: 12, color: '#666', marginTop: 6 }}>• {s}</div>
                  ))}
                </div>
              </div>
            </div>
            {audioUrl && (
              <audio src={audioUrl} controls />
            )}
          </Space>
        </Card>

        <Card title="分析音色" extra={hasVoiceStyle ? <Text type="success">已建模{lastUpdatedAt ? `（${formatTime(lastUpdatedAt)}）` : ''}</Text> : <Text type="secondary">未建模</Text>}>
          <Space direction="vertical">
            <Button type="primary" onClick={handleAnalyze} loading={analyzing} disabled={!audioUrl}>
              开始分析
            </Button>
            {voiceStyle && (
              <div>
                <Text><CheckCircleTwoTone twoToneColor="#52c41a" /> 分析完成：</Text>
                <div style={{ marginTop: 8 }}>
                  <div>语调：{voiceStyle.tone_style || '-'}</div>
                  <div>语速：{String(voiceStyle.speaking_speed ?? '-')}</div>
                  <div>用词：{voiceStyle.vocabulary_style || '-'}</div>
                </div>
              </div>
            )}
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default ParentVoice;


