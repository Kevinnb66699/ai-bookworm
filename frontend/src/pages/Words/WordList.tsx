import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Word } from '../../types';
import { words, importExport } from '../../services/api';
import Toast from '../../components/Toast/Toast';
import './WordList.css';

interface ToastMessage {
    message: string;
    type: 'success' | 'error' | 'info';
}

const WordList: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const [wordList, setWordList] = useState<Word[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedWord, setSelectedWord] = useState<Word | null>(null);
    const [toast, setToast] = useState<ToastMessage | null>(null);
    const [newWord, setNewWord] = useState({
        word: '',
        meaning: '',
        example: '',
        pronunciation: '',
        course_id: Number(courseId)
    });
    const [importFile, setImportFile] = useState<File | null>(null);

    useEffect(() => {
        loadWords();
    }, [courseId]);

    const showToast = (message: string, type: 'success' | 'error' | 'info') => {
        setToast({ message, type });
    };

    const loadWords = async () => {
        try {
            const response = await words.getAll(Number(courseId));
            setWordList(response.data);
        } catch (error) {
            console.error('Error loading words:', error);
            showToast('加载单词列表失败', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateWord = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await words.create(newWord);
            setShowCreateModal(false);
            setNewWord({
                word: '',
                meaning: '',
                example: '',
                pronunciation: '',
                course_id: Number(courseId)
            });
            loadWords();
            showToast('添加单词成功', 'success');
        } catch (error) {
            console.error('Error creating word:', error);
            showToast('添加单词失败', 'error');
        }
    };

    const handleEditWord = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedWord) return;

        try {
            await words.update(selectedWord.id, {
                word: selectedWord.word,
                meaning: selectedWord.meaning,
                example: selectedWord.example,
                pronunciation: selectedWord.pronunciation,
                course_id: Number(courseId)
            });
            setShowEditModal(false);
            setSelectedWord(null);
            loadWords();
            showToast('更新单词成功', 'success');
        } catch (error) {
            console.error('Error updating word:', error);
            showToast('更新单词失败', 'error');
        }
    };

    const handleDeleteWord = async () => {
        if (!selectedWord) return;

        try {
            await words.delete(selectedWord.id);
            setShowDeleteConfirm(false);
            setSelectedWord(null);
            loadWords();
            showToast('删除单词成功', 'success');
        } catch (error) {
            console.error('Error deleting word:', error);
            showToast('删除单词失败', 'error');
        }
    };

    const handleImportWords = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!importFile || !courseId) return;

        try {
            await importExport.importWords(Number(courseId), importFile);
            setShowImportModal(false);
            setImportFile(null);
            loadWords();
            showToast('导入单词成功', 'success');
        } catch (error) {
            console.error('Error importing words:', error);
            showToast('导入单词失败', 'error');
        }
    };

    const handleExportWords = async () => {
        if (!courseId) return;
        try {
            const response = await importExport.exportWords(Number(courseId));
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `words_${courseId}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            showToast('导出单词成功', 'success');
        } catch (error) {
            console.error('Error exporting words:', error);
            showToast('导出单词失败', 'error');
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await importExport.getWordTemplate();
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'word_template.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
            showToast('下载模板成功', 'success');
        } catch (error) {
            console.error('Error downloading template:', error);
            showToast('下载模板失败', 'error');
        }
    };

    const openEditModal = (word: Word) => {
        setSelectedWord(word);
        setShowEditModal(true);
    };

    const openDeleteConfirm = (word: Word) => {
        setSelectedWord(word);
        setShowDeleteConfirm(true);
    };

    if (loading) {
        return <div className="loading">加载中...</div>;
    }

    return (
        <div className="word-list">
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
            <div className="word-list-header">
                <h1>单词管理</h1>
                <div className="word-actions">
                    <button
                        className="btn btn-outline"
                        onClick={handleDownloadTemplate}
                    >
                        下载模板
                    </button>
                    <button
                        className="btn btn-outline"
                        onClick={() => setShowImportModal(true)}
                    >
                        导入单词
                    </button>
                    <button
                        className="btn btn-outline"
                        onClick={handleExportWords}
                    >
                        导出单词
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowCreateModal(true)}
                    >
                        添加单词
                    </button>
                </div>
            </div>

            <div className="word-table">
                <table>
                    <thead>
                        <tr>
                            <th>单词</th>
                            <th>发音</th>
                            <th>含义</th>
                            <th>例句</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {wordList.map(word => (
                            <tr key={word.id}>
                                <td>{word.word}</td>
                                <td>{word.pronunciation}</td>
                                <td>{word.meaning}</td>
                                <td>{word.example}</td>
                                <td>
                                    <button 
                                        className="btn btn-outline btn-sm"
                                        onClick={() => openEditModal(word)}
                                    >
                                        编辑
                                    </button>
                                    <button 
                                        className="btn btn-outline btn-sm btn-danger"
                                        onClick={() => openDeleteConfirm(word)}
                                    >
                                        删除
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showCreateModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>添加新单词</h2>
                        <form onSubmit={handleCreateWord}>
                            <div className="form-group">
                                <label htmlFor="word">单词</label>
                                <input
                                    type="text"
                                    id="word"
                                    value={newWord.word}
                                    onChange={e => setNewWord({ ...newWord, word: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="pronunciation">发音</label>
                                <input
                                    type="text"
                                    id="pronunciation"
                                    value={newWord.pronunciation}
                                    onChange={e => setNewWord({ ...newWord, pronunciation: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="meaning">含义</label>
                                <input
                                    type="text"
                                    id="meaning"
                                    value={newWord.meaning}
                                    onChange={e => setNewWord({ ...newWord, meaning: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="example">例句</label>
                                <textarea
                                    id="example"
                                    value={newWord.example}
                                    onChange={e => setNewWord({ ...newWord, example: e.target.value })}
                                />
                            </div>
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    取消
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    添加
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showEditModal && selectedWord && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>编辑单词</h2>
                        <form onSubmit={handleEditWord}>
                            <div className="form-group">
                                <label htmlFor="edit-word">单词</label>
                                <input
                                    type="text"
                                    id="edit-word"
                                    value={selectedWord.word}
                                    onChange={e => setSelectedWord({ ...selectedWord, word: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="edit-pronunciation">发音</label>
                                <input
                                    type="text"
                                    id="edit-pronunciation"
                                    value={selectedWord.pronunciation}
                                    onChange={e => setSelectedWord({ ...selectedWord, pronunciation: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="edit-meaning">含义</label>
                                <input
                                    type="text"
                                    id="edit-meaning"
                                    value={selectedWord.meaning}
                                    onChange={e => setSelectedWord({ ...selectedWord, meaning: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="edit-example">例句</label>
                                <textarea
                                    id="edit-example"
                                    value={selectedWord.example}
                                    onChange={e => setSelectedWord({ ...selectedWord, example: e.target.value })}
                                />
                            </div>
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setSelectedWord(null);
                                    }}
                                >
                                    取消
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    保存
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showDeleteConfirm && selectedWord && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>确认删除</h2>
                        <p>确定要删除单词 "{selectedWord.word}" 吗？此操作不可撤销。</p>
                        <div className="modal-actions">
                            <button
                                className="btn btn-outline"
                                onClick={() => {
                                    setShowDeleteConfirm(false);
                                    setSelectedWord(null);
                                }}
                            >
                                取消
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={handleDeleteWord}
                            >
                                删除
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showImportModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>导入单词</h2>
                        <form onSubmit={handleImportWords}>
                            <div className="form-group">
                                <label htmlFor="importFile">选择CSV文件</label>
                                <input
                                    type="file"
                                    id="importFile"
                                    accept=".csv"
                                    onChange={e => setImportFile(e.target.files?.[0] || null)}
                                    required
                                />
                            </div>
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => setShowImportModal(false)}
                                >
                                    取消
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    导入
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WordList; 