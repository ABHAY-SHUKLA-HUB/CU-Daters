import React from 'react';

const EMOJI_SECTIONS = {
  smileys: ['😀', '😄', '😁', '🥹', '😍', '😘', '😎', '🤗', '😇', '😴', '🤔', '😭'],
  hearts: ['❤️', '💕', '💖', '💘', '💝', '💗', '💞', '💓', '💟', '💌', '💍', '💐'],
  gestures: ['👋', '👍', '👏', '🙌', '🔥', '✨', '🥰', '🤝', '💯', '🎉', '🙏', '🤍'],
  campus: ['📚', '🎓', '☕', '🍕', '🎵', '🏫', '🧋', '📸', '🌙', '🚌', '⚽', '🎬']
};

const ACCEPTED_FILE_TYPES = '.png,.jpg,.jpeg,.webp,.gif,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.mp3,.wav,.m4a,.aac';
const MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024;

export default function MessageComposer({
  disabled,
  onSend,
  onSendVoiceNote,
  onSendAttachment,
  onTypingStart,
  onTypingStop,
  onError
}) {
  const [value, setValue] = React.useState('');
  const [recordingState, setRecordingState] = React.useState('idle');
  const [recordSeconds, setRecordSeconds] = React.useState(0);
  const [emojiOpen, setEmojiOpen] = React.useState(false);
  const [recentEmojis, setRecentEmojis] = React.useState(['❤️', '🔥', '✨', '😊']);
  const [activeEmojiSection, setActiveEmojiSection] = React.useState('smileys');
  const [pendingFiles, setPendingFiles] = React.useState([]);
  const [audioPreviewUrl, setAudioPreviewUrl] = React.useState('');
  const [audioBlob, setAudioBlob] = React.useState(null);
  const [recordingError, setRecordingError] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const typingTimerRef = React.useRef(null);
  const recordingIntervalRef = React.useRef(null);
  const mediaRecorderRef = React.useRef(null);
  const mediaStreamRef = React.useRef(null);
  const chunksRef = React.useRef([]);
  const fileInputRef = React.useRef(null);
  const textareaRef = React.useRef(null);
  const isTypingRef = React.useRef(false);
  const sendLockRef = React.useRef(false);

  const clearRecordingTimer = React.useCallback(() => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  }, []);

  const stopMediaTracks = React.useCallback(() => {
    if (!mediaStreamRef.current) {
      return;
    }
    mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }, []);

  const resetRecordingData = React.useCallback(() => {
    setRecordSeconds(0);
    setRecordingState('idle');
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
    }
    setAudioPreviewUrl('');
    setAudioBlob(null);
    chunksRef.current = [];
  }, [audioPreviewUrl]);

  const flushTypingStop = React.useCallback(() => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    isTypingRef.current = false;
    onTypingStop();
  }, [onTypingStop]);

  React.useEffect(() => {
    return () => {
      flushTypingStop();
      clearRecordingTimer();
      stopMediaTracks();
      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl);
      }
      pendingFiles.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, [audioPreviewUrl, clearRecordingTimer, flushTypingStop, pendingFiles, stopMediaTracks]);

  const handleChange = (event) => {
    const next = event.target.value;
    setValue(next);

    if (!isTypingRef.current && next.trim().length > 0) {
      isTypingRef.current = true;
      onTypingStart();
    }

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    typingTimerRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        onTypingStop();
      }
    }, 1200);

    if (!next.trim().length && isTypingRef.current) {
      isTypingRef.current = false;
      onTypingStop();
    }
  };

  const handleSend = async () => {
    if (isSending || sendLockRef.current) {
      return;
    }

    const text = value.trim();
    if (!text || disabled) {
      return;
    }

    try {
      sendLockRef.current = true;
      setIsSending(true);
      await onSend(text);
      setValue('');
      textareaRef.current?.focus();
      flushTypingStop();
    } catch (error) {
      const message = error?.message || 'Unable to send message';
      onError?.(message);
    } finally {
      setIsSending(false);
      sendLockRef.current = false;
    }
  };

  const startRecording = async () => {
    if (disabled || recordingState === 'recording') {
      return;
    }

    setRecordingError('');
    resetRecordingData();

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Voice recording is not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (blob.size === 0) {
          setRecordingError('Recorded audio is empty. Please record again.');
          resetRecordingData();
          stopMediaTracks();
          return;
        }

        if (audioPreviewUrl) {
          URL.revokeObjectURL(audioPreviewUrl);
        }
        const previewUrl = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioPreviewUrl(previewUrl);
        setRecordingState('preview');
        stopMediaTracks();
      };

      recorder.start();
      setRecordingState('recording');
      recordingIntervalRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      const message = error?.message || 'Unable to start recording';
      setRecordingError(message);
      onError?.(message);
      clearRecordingTimer();
      stopMediaTracks();
      setRecordingState('idle');
    }
  };

  const pauseRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
      return;
    }
    mediaRecorderRef.current.pause();
    clearRecordingTimer();
    setRecordingState('paused');
  };

  const resumeRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'paused') {
      return;
    }
    mediaRecorderRef.current.resume();
    setRecordingState('recording');
    recordingIntervalRef.current = setInterval(() => {
      setRecordSeconds((prev) => prev + 1);
    }, 1000);
  };

  const cancelRecording = () => {
    setRecordingState('idle');
    clearRecordingTimer();

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }

    resetRecordingData();
    stopMediaTracks();
  };

  const finishRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      return;
    }
    clearRecordingTimer();
    mediaRecorderRef.current.stop();
  };

  const sendRecording = () => {
    if (isSending) {
      return;
    }

    if (!audioBlob || !audioPreviewUrl || recordSeconds < 1) {
      setRecordingError('Record a valid voice note before sending.');
      return;
    }

    setIsSending(true);

    Promise.resolve(
      onSendVoiceNote?.({
        blob: audioBlob,
        previewUrl: audioPreviewUrl,
        durationSec: recordSeconds,
        mimeType: 'audio/webm',
        fileName: `voice-note-${Date.now()}.webm`
      })
    )
      .then(() => {
        resetRecordingData();
      })
      .catch((sendError) => {
        const message = sendError?.message || 'Unable to send voice note';
        setRecordingError(message);
        onError?.(message);
      })
      .finally(() => {
        setIsSending(false);
      });
  };

  const formatSeconds = (seconds) => {
    const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  const insertEmoji = (emoji) => {
    setValue((prev) => {
      const next = `${prev}${emoji}`;
      if (!isTypingRef.current && next.trim().length > 0) {
        isTypingRef.current = true;
        onTypingStart();
      }
      return next;
    });
    setRecentEmojis((prev) => [emoji, ...prev.filter((item) => item !== emoji)].slice(0, 12));
    setEmojiOpen(false);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const inferAttachmentKind = (type) => {
    if (type?.startsWith('image/')) return 'image';
    if (type?.startsWith('audio/')) return 'audio';
    return 'file';
  };

  const handleChooseFiles = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) {
      return;
    }

    const oversized = files.find((file) => file.size > MAX_ATTACHMENT_SIZE);
    if (oversized) {
      onError?.(`File too large: ${oversized.name}. Max 20MB per file.`);
      event.target.value = '';
      return;
    }

    const prepared = files.slice(0, 5).map((file) => {
      const kind = inferAttachmentKind(file.type);
      return {
        id: `${file.name}-${file.size}-${Date.now()}`,
        file,
        name: file.name,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
        kind,
        previewUrl: kind === 'image' ? URL.createObjectURL(file) : ''
      };
    });

    setPendingFiles((prev) => [...prev, ...prepared].slice(0, 6));
    event.target.value = '';
  };

  const removePendingFile = (fileId) => {
    setPendingFiles((prev) => {
      const target = prev.find((item) => item.id === fileId);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== fileId);
    });
  };

  const sendPendingFiles = async () => {
    if (!pendingFiles.length || disabled || isSending) {
      return;
    }

    try {
      setIsSending(true);
      await onSendAttachment?.(pendingFiles);
      pendingFiles.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
      setPendingFiles([]);
    } catch (error) {
      const message = error?.message || 'Failed to upload attachment(s).';
      onError?.(message);
    } finally {
      setIsSending(false);
    }
  };

  const recordingActive = recordingState === 'recording' || recordingState === 'paused';

  return (
    <div className="border-t border-softPink/45 bg-white/85 backdrop-blur p-3 md:p-4 sticky bottom-0">
      {recordingError ? <p className="text-xs text-red-600 mb-2">{recordingError}</p> : null}

      {recordingActive ? (
        <div className="rounded-2xl border border-rose-300/55 bg-rose-50/90 px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-rose-700 text-sm font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              {recordingState === 'paused' ? 'Recording paused' : 'Recording'} {formatSeconds(recordSeconds)}
            </div>
            <div className="mt-1 flex items-end gap-1 h-4">
              {[6, 11, 8, 14, 7, 12, 9].map((bar, index) => (
                <span
                  key={`${bar}-${index}`}
                  className={`w-1 rounded-full bg-rose-400/80 ${recordingState === 'recording' ? 'animate-pulse' : ''}`}
                  style={{ height: `${bar}px`, animationDelay: `${index * 0.08}s` }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {recordingState === 'recording' ? (
              <button
                type="button"
                onClick={pauseRecording}
                className="px-3 py-1.5 rounded-xl border border-rose-300 text-rose-700 text-sm font-medium hover:bg-rose-100"
              >
                Pause
              </button>
            ) : (
              <button
                type="button"
                onClick={resumeRecording}
                className="px-3 py-1.5 rounded-xl border border-rose-300 text-rose-700 text-sm font-medium hover:bg-rose-100"
              >
                Resume
              </button>
            )}
            <button
              type="button"
              onClick={cancelRecording}
              className="px-3 py-1.5 rounded-xl border border-rose-300 text-rose-700 text-sm font-medium hover:bg-rose-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={finishRecording}
              className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-500"
            >
              Done
            </button>
          </div>
        </div>
      ) : recordingState === 'preview' ? (
        <div className="rounded-2xl border border-emerald-300/50 bg-emerald-50/70 px-4 py-3">
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-sm font-semibold text-emerald-700">Voice note preview ({formatSeconds(recordSeconds)})</p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={cancelRecording} className="px-3 py-1.5 rounded-xl border border-emerald-300 text-emerald-700 text-sm font-medium hover:bg-emerald-100">Discard</button>
              <button type="button" onClick={sendRecording} className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500">Send</button>
            </div>
          </div>
          <audio controls src={audioPreviewUrl} className="w-full h-9" />
        </div>
      ) : (
        <>
          {pendingFiles.length ? (
            <div className="mb-2 rounded-2xl border border-softPink/50 bg-white/90 px-3 py-2.5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-darkBrown">Attachment preview ({pendingFiles.length})</p>
                <button type="button" onClick={sendPendingFiles} className="text-xs px-3 py-1 rounded-full bg-blushPink text-white font-semibold hover:opacity-90">Send files</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {pendingFiles.map((item) => (
                  <div key={item.id} className="rounded-xl border border-softPink/45 bg-creamyWhite/80 p-2 text-xs">
                    {item.kind === 'image' && item.previewUrl ? (
                      <img src={item.previewUrl} alt={item.name} className="w-full h-20 object-cover rounded-lg mb-1" />
                    ) : (
                      <div className="h-20 rounded-lg mb-1 border border-softPink/30 bg-white flex items-center justify-center text-xl">
                        {item.kind === 'audio' ? '🎵' : '📄'}
                      </div>
                    )}
                    <p className="font-medium truncate text-darkBrown">{item.name}</p>
                    <p className="text-softBrown">{formatFileSize(item.size)}</p>
                    <button type="button" onClick={() => removePendingFile(item.id)} className="mt-1 text-[11px] text-rose-600 font-semibold">Remove</button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex items-end gap-2 md:gap-3 relative">
            <button
              type="button"
              onClick={() => setEmojiOpen((prev) => !prev)}
              disabled={disabled || isSending}
              className="w-10 h-10 rounded-xl border border-softPink/50 bg-white hover:bg-softPink/15 disabled:opacity-45"
              title="Insert emoji"
            >
              😊
            </button>

            {emojiOpen ? (
              <div className="absolute bottom-12 left-0 z-30 w-[320px] rounded-2xl border border-softPink/45 bg-white shadow-[0_24px_55px_rgba(0,0,0,0.2)] p-3">
                <p className="text-[11px] font-semibold text-softBrown uppercase tracking-[0.14em] mb-2">Recent</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {recentEmojis.map((emoji) => (
                    <button key={emoji} type="button" onClick={() => insertEmoji(emoji)} className="w-8 h-8 rounded-lg hover:bg-softPink/20 text-lg">{emoji}</button>
                  ))}
                </div>
                <div className="flex items-center gap-1 mb-2">
                  {Object.keys(EMOJI_SECTIONS).map((section) => (
                    <button
                      key={section}
                      type="button"
                      onClick={() => setActiveEmojiSection(section)}
                      className={`text-[11px] px-2 py-1 rounded-full border ${activeEmojiSection === section ? 'border-blushPink bg-softPink/20 text-darkBrown' : 'border-softPink/40 text-softBrown hover:bg-softPink/10'}`}
                    >
                      {section}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-8 gap-1 max-h-36 overflow-y-auto pr-1">
                  {(EMOJI_SECTIONS[activeEmojiSection] || []).map((emoji) => (
                    <button key={`${activeEmojiSection}-${emoji}`} type="button" onClick={() => insertEmoji(emoji)} className="w-8 h-8 rounded-lg hover:bg-softPink/20 text-lg">
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isSending}
              className="w-10 h-10 rounded-xl border border-softPink/50 bg-white hover:bg-softPink/15 disabled:opacity-45"
              title="Attach file"
            >
              📎
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_FILE_TYPES}
              onChange={handleChooseFiles}
              className="hidden"
            />

            <div className="flex-1 rounded-2xl border border-softPink/60 bg-white shadow-[0_8px_24px_rgba(242,170,188,0.2)] px-3 py-2">
              <textarea
                ref={textareaRef}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder={disabled ? 'Chat is unavailable' : 'Write a message...'}
                className="w-full resize-none bg-transparent focus:outline-none text-[15px] leading-6 text-slate-800 placeholder:text-slate-400 caret-rose-500"
                disabled={disabled || isSending}
              />
            </div>

            <button
              type="button"
              onClick={startRecording}
              disabled={disabled || isSending}
              className="w-10 h-10 rounded-xl border border-softPink/50 bg-white hover:bg-softPink/15 disabled:opacity-45"
              title="Record voice note"
            >
              🎙️
            </button>

            <button
              onClick={() => void handleSend()}
              disabled={disabled || isSending || !value.trim()}
              className="h-10 px-4 rounded-xl bg-gradient-to-r from-blushPink to-softPink text-white font-semibold shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </>
      )}

      {!disabled ? (
        <p className="text-[11px] text-softBrown mt-2 px-1">Enter to send. Shift+Enter for a new line.</p>
      ) : null}
    </div>
  );
}
