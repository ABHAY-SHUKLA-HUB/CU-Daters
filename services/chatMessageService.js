import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

const resolveDeliveryStatus = (message) => {
  if (message?.seen) {
    return 'seen';
  }
  if (message?.delivered) {
    return 'delivered';
  }
  return message?.deliveryStatus || 'sent';
};

const toClientMessage = (message) => {
  const raw = typeof message?.toObject === 'function' ? message.toObject() : message;
  return {
    ...raw,
    _id: raw?._id?.toString?.() || raw?._id,
    conversationId: raw?.conversationId?.toString?.() || raw?.conversationId,
    senderId: raw?.senderId?.toString?.() || raw?.senderId,
    receiverId: raw?.receiverId?.toString?.() || raw?.receiverId,
    clientMessageId: raw?.clientMessageId || '',
    clientTempId: raw?.clientMessageId || raw?.clientTempId || '',
    deliveryStatus: resolveDeliveryStatus(raw)
  };
};

const toConversationPreviewText = ({ messageType, text }) => {
  if (messageType === 'voice') {
    return 'Voice note';
  }
  if (messageType === 'image') {
    return 'Image';
  }
  if (messageType === 'file' || messageType === 'attachment') {
    return 'Attachment';
  }
  return String(text || '').trim();
};

export const persistMessageAndFanout = async ({
  conversationId,
  senderId,
  receiverId,
  text = '',
  messageType = 'text',
  attachment,
  voiceNote,
  clientMessageId = '',
  isReceiverOnline = false,
  io,
  emitEvents = true
}) => {
  let message = null;
  let isNewMessage = false;

  if (clientMessageId) {
    message = await Message.findOne({ conversationId, senderId, clientMessageId });
  }

  if (!message) {
    message = await Message.create({
      conversationId,
      senderId,
      receiverId,
      text,
      messageType,
      attachment: attachment || undefined,
      voiceNote: voiceNote || undefined,
      clientMessageId: clientMessageId || undefined,
      delivered: isReceiverOnline,
      seen: false,
      deliveryStatus: isReceiverOnline ? 'delivered' : 'sent'
    });
    isNewMessage = true;

    await Conversation.findByIdAndUpdate(conversationId, {
      $set: {
        lastMessage: toConversationPreviewText({ messageType, text: message.text }),
        lastMessageTime: message.createdAt
      }
    });
  }

  const outbound = toClientMessage(message);

  if (io && emitEvents && isNewMessage) {
    io.to(`chat:${conversationId}`).emit('receive_message', outbound);
    io.to(`user:${receiverId}`).emit('chat_notification', {
      conversationId,
      text: toConversationPreviewText({ messageType, text: message.text }),
      senderId: senderId.toString()
    });
  }

  return { message: outbound, isNewMessage };
};
