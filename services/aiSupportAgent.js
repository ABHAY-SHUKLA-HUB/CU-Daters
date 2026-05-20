import SupportTicket from '../models/SupportTicket.js';
import SupportMessage from '../models/SupportMessage.js';
import SupportAILog from '../models/SupportAILog.js';
import SupportNotification from '../models/SupportNotification.js';

class AISupportAgent {
  constructor() {
    this.responses = {
      verification: {
        greeting: "Hi! 👋 I'm the SeeU Daters AI Support Agent. I'm here to help you with your verification issues. Could you please describe the problem you're facing in detail?",
        questions: [
          "Have you uploaded all the required documents (ID, selfie, etc.)?",
          "Did you receive any rejection reason for your verification?",
          "What type of document did you try to upload?",
          "Are you encountering any error messages?"
        ],
        solutions: [
          "Make sure your ID is clear, not expired, and matches your profile information",
          "Your selfie should have good lighting and clearly show your face",
          "The document must be a government-issued ID (Passport, License, Aadhar, etc.)",
          "All documents must be uploaded as JPG or PNG format, less than 5MB",
          "Try uploading from a different browser or device",
          "Clear your browser cache and cookies, then retry",
          "Ensure your internet connection is stable during upload"
        ]
      },
      login_problem: {
        greeting: "Hello! 👋 I'm the SeeU Daters AI Support Agent. Let's troubleshoot your login issue. What's happening when you try to log in?",
        questions: [
          "Are you getting a specific error message?",
          "Is your account verified?",
          "Have you recently changed your password?",
          "Are you using the correct email/username?",
          "Have you tried resetting your password?"
        ],
        solutions: [
          "Check if you're entering the correct email or username",
          "Ensure your account is verified (check your email for verification link)",
          "Try resetting your password using 'Forgot Password' option",
          "Clear browser cache and cookies",
          "Try logging in from an incognito/private window",
          "Check if your email is correct - typos are common!",
          "Make sure Caps Lock is not on when entering password",
          "Try using a different browser or device",
          "Disable browser extensions that might interfere with login",
          "Check your internet connection"
        ]
      },
      payment: {
        greeting: "Hi! 👋 I'm the AI Support Agent. I'm here to help with your payment questions. What's your concern about payments or subscription?",
        questions: [
          "What payment method are you using?",
          "Did you receive a payment confirmation?",
          "Is your subscription active?",
          "Did you get a refund request?",
          "Are you facing a transaction error?"
        ],
        solutions: [
          "Ensure your card details are entered correctly",
          "Check if your card has sufficient balance",
          "Try a different payment method",
          "Ensure your card is not expired",
          "Contact your bank if the transaction is declining",
          "Use the same card that was used for payment",
          "Check internet connection during payment",
          "Don't close the browser during payment processing",
          "Verify your billing address matches your card address",
          "Check your email for payment receipts and invoices"
        ]
      },
      report_user: {
        greeting: "I'm the AI Support Agent. 🚨 I'm sorry to hear you need to report a user. Your safety is important to us. Please provide details about the issue.",
        questions: [
          "What type of violation did you witness?",
          "When did this happen?",
          "Do you have screenshots?",
          "Is this related to harassment or inappropriate behavior?",
          "Have you blocked this user?"
        ],
        solutions: [
          "Document all evidence (screenshots, messages) before reporting",
          "Use the 'Report User' button on their profile",
          "Block the user immediately to prevent further contact",
          "Do not engage with the reported user",
          "Our moderation team will review your report within 24 hours",
          "We take all reports seriously and maintain confidentiality",
          "You can appeal our decision if you disagree",
          "Keep copies of all evidence for reference"
        ]
      },
      bug: {
        greeting: "Hi! 👋 I'm the AI Support Agent. Thanks for reporting this bug. Let's gather some details so our tech team can fix it quickly.",
        questions: [
          "What were you trying to do when the bug occurred?",
          "What device and browser are you using?",
          "Did you get an error message?",
          "Is it affecting all features or just one?",
          "Can you reproduce the bug consistently?"
        ],
        solutions: [
          "Try refreshing the page (Ctrl+R or Cmd+R)",
          "Clear browser cache and cookies",
          "Try using a different browser",
          "Update your browser to the latest version",
          "Try from a different device",
          "Disable browser extensions temporarily",
          "Check your internet connection",
          "Try in incognito/private mode",
          "Restart your device",
          "Contact our dev team with detailed steps to reproduce"
        ]
      },
      other: {
        greeting: "Hi! 👋 I'm the AI Support Agent. Please tell me more about your issue so I can assist you better.",
        questions: [
          "Can you describe the issue in detail?",
          "When did this issue start?",
          "Have you tried any troubleshooting steps?",
          "Does this affect your experience?",
          "Is this the first time this happened?"
        ],
        solutions: [
          "Try refreshing the page",
          "Clear browser cache",
          "Try a different browser or device",
          "Check your internet connection",
          "Disable browser extensions",
          "Restart your device",
          "Update the app/browser",
          "Contact our support team directly"
        ]
      }
    };
  }

  // Get AI greeting based on category
  getGreeting(category) {
    const categoryData = this.responses[category] || this.responses.other;
    return categoryData.greeting;
  }

  // Get relevant follow-up questions based on category and user message
  getFollowUpQuestion(category, userMessage, askedQuestions = []) {
    const categoryData = this.responses[category] || this.responses.other;
    const availableQuestions = categoryData.questions.filter(q => !askedQuestions.includes(q));
    
    if (availableQuestions.length === 0) {
      return "I've asked several questions to understand your issue better. Based on what you've shared, could you tell me if you've tried any of the troubleshooting steps I mentioned?";
    }
    
    // Return next relevant question
    return availableQuestions[0];
  }

  // Get troubleshooting steps based on category and user message keywords
  getTroubleshootingSteps(category, userMessage) {
    const categoryData = this.responses[category] || this.responses.other;
    return categoryData.solutions;
  }

  // Generate AI response based on user message
  async generateAIResponse(supportTicket, userMessage) {
    try {
      const category = supportTicket.category || 'other';
      const categoryData = this.responses[category] || this.responses.other;
      
      // Analyze user sentiment and urgency
      const sentiment = this.analyzeSentiment(userMessage);
      const urgency = this.determineUrgency(userMessage, sentiment);
      
      // Get relevant questions and solutions
      const relevantQuestions = categoryData.questions;
      const relevantSolutions = categoryData.solutions;
      
      // Build contextual response
      let aiResponse = "";
      
      // If user seems frustrated or urgent, offer quick solutions
      if (urgency === 'critical' || sentiment === 'negative') {
        aiResponse = "I understand this is urgent. Let me help you right away:\n\n";
        aiResponse += relevantSolutions.slice(0, 3).map((sol, i) => `${i + 1}. ${sol}`).join('\n');
        aiResponse += "\n\nIf none of these work, I can escalate this to our support team immediately. Just let me know!";
      } else {
        // Ask follow-up questions to understand better
        aiResponse = "Thank you for providing that information. " + relevantQuestions[0] + "\n\nHere are some quick troubleshooting steps that often help:\n";
        aiResponse += relevantSolutions.slice(0, 2).map((sol, i) => `${i + 1}. ${sol}`).join('\n');
      }
      
      // Log AI response
      await this.logAIResponse(supportTicket._id, supportTicket.user_id, userMessage, aiResponse, relevantQuestions, urgency, sentiment);
      
      return {
        response: aiResponse,
        shouldEscalate: urgency === 'critical' || sentiment === 'negative',
        confidence: this.calculateConfidence(category, userMessage),
        urgency,
        sentiment
      };
    } catch (error) {
      console.error('❌ AI Response Generation Error:', error);
      return {
        response: "I'm experiencing a temporary issue. Let me connect you with our support team right away.",
        shouldEscalate: true,
        confidence: 0
      };
    }
  }

  // Analyze sentiment from user message
  analyzeSentiment(message) {
    const negativeSentiments = ['frustrat', 'angry', 'upset', 'problem', 'broken', 'not work', 'fail', 'error', '😤', '😡', '😠', '😤'];
    const positiveSentiments = ['thank', 'great', 'awesome', 'love', 'work', 'fix', '😊', '😄', '👍'];
    
    const lowerMessage = message.toLowerCase();
    
    let negativeCount = 0;
    let positiveCount = 0;
    
    negativeSentiments.forEach(sentiment => {
      if (lowerMessage.includes(sentiment)) negativeCount++;
    });
    
    positiveSentiments.forEach(sentiment => {
      if (lowerMessage.includes(sentiment)) positiveCount++;
    });
    
    if (negativeCount > positiveCount) return 'negative';
    if (positiveCount > negativeCount) return 'positive';
    return 'neutral';
  }

  // Determine urgency level
  determineUrgency(message, sentiment) {
    const criticalKeywords = ['urgent', 'asap', 'immediately', 'critical', 'emergency', '!'];
    const highKeywords = ['important', 'soon', 'quickly', 'problem', 'issue'];
    
    const lowerMessage = message.toLowerCase();
    
    const criticalCount = criticalKeywords.filter(keyword => lowerMessage.includes(keyword)).length;
    const highCount = highKeywords.filter(keyword => lowerMessage.includes(keyword)).length;
    
    if (criticalCount > 0 || (sentiment === 'negative' && highCount > 1)) return 'critical';
    if (highCount > 0 || sentiment === 'negative') return 'high';
    return 'medium';
  }

  // Calculate confidence score
  calculateConfidence(category, userMessage) {
    let confidence = 70; // Base confidence
    
    // Increase confidence for specific categories
    if (['verification', 'login_problem', 'payment'].includes(category)) {
      confidence += 15;
    }
    
    // Increase based on message length and detail
    if (userMessage.length > 100) confidence += 10;
    if (userMessage.length > 200) confidence += 5;
    
    return Math.min(confidence, 95);
  }

  // Log AI response
  async logAIResponse(ticketId, userId, userMessage, aiResponse, questionsAsked, urgency, sentiment) {
    try {
      const log = new SupportAILog({
        support_ticket_id: ticketId,
        user_id: userId,
        user_message: userMessage,
        ai_response: aiResponse,
        questions_asked: questionsAsked,
        confidence_score: this.calculateConfidence('other', userMessage),
        sentiment_analysis: {
          user_sentiment: sentiment,
          urgency_level: urgency
        },
        response_time_ms: Math.random() * 1000, // Simulated response time
        ai_model_version: 'v1.0'
      });
      
      await log.save();
      return log;
    } catch (error) {
      console.error('❌ Error logging AI response:', error);
    }
  }

  // Check if user wants to escalate to human support
  shouldEscalateToHuman(userMessage) {
    const escalationKeywords = ['support', 'human', 'agent', 'representative', 'real person', 'not solved', 'not helpful', 'escalate', 'transfer', 'talk to someone'];
    const lowerMessage = userMessage.toLowerCase();
    
    return escalationKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  // Get canned responses for common questions
  getCannedResponse(question) {
    const cannedResponses = {
      'how do i verify': 'To verify your account: 1) Go to Settings > Verification 2) Upload required documents (ID + Selfie) 3) Our team reviews within 24 hours',
      'how do i reset password': 'Click "Forgot Password" on the login page, enter your email, check your inbox for reset link, and set a new password',
      'how do i report': 'Click on the user\'s profile, select "Report User", choose the reason, add details and/or screenshots, then submit',
      'payment failed': 'Please check: 1) Your card details 2) Card balance 3) Internet connection. Try again or use a different payment method',
      'account locked': 'For security, accounts may be locked after multiple failed login attempts. Wait 30 minutes or contact support@seeudaters.in'
    };
    
    for (const [keyword, response] of Object.entries(cannedResponses)) {
      if (question.toLowerCase().includes(keyword)) {
        return response;
      }
    }
    
    return null;
  }
}

export default new AISupportAgent();
