const HealthAssessment = require('../models/HealthAssessment');
const Progress = require('../models/Progress');
const Notification = require('../models/Notification');
const PDFDocument = require('pdfkit');

const generateRiskAlerts = (medicalConditions, bmi) => {
  const alerts = [];
  const lowerConditions = medicalConditions.map(c => c.toLowerCase());
  
  if (lowerConditions.some(c => c.includes('knee') || c.includes('joint'))) {
    alerts.push('Avoid high-impact exercises like heavy squats or jumping.');
  }
  if (lowerConditions.some(c => c.includes('heart') || c.includes('cardio'))) {
    alerts.push('Monitor heart rate closely. Avoid extreme high-intensity interval training (HIIT).');
  }
  if (lowerConditions.some(c => c.includes('asthma'))) {
    alerts.push('Keep inhaler nearby. Avoid exercising in extreme cold or dusty environments.');
  }
  
  if (bmi >= 30) {
    alerts.push('High BMI detected. Start with low-impact cardio to reduce joint stress.');
  } else if (bmi < 18.5) {
    alerts.push('Low BMI detected. Focus on strength training and caloric surplus.');
  }

  return alerts;
};

exports.createAssessment = async (req, res) => {
  const { age, gender, weightKg, heightCm, medicalConditions = [], goals, targetWeightKg } = req.body;
  const userId = req.user._id;

  try {
    // Calculate BMI (height in cm, weight in kg)
    const heightInMeters = heightCm / 100;
    const bmi = weightKg / (heightInMeters * heightInMeters);
    
    let category = 'Normal';
    if (bmi < 18.5) category = 'Underweight';
    else if (bmi >= 25 && bmi < 30) category = 'Overweight';
    else if (bmi >= 30) category = 'Obese';

    // Get existing progress to check consistency
    let progress = await Progress.findOne({ user: userId });
    if (!progress) {
      progress = await Progress.create({ user: userId, targetWeightKg, attendanceCount: 0, workoutConsistency: 0 });
    } else if (targetWeightKg) {
      progress.targetWeightKg = targetWeightKg;
      await progress.save();
    }

    // Health Score 0-100 based on BMI and workout consistency
    let healthScore = 100;
    if (category === 'Underweight') healthScore -= 20;
    if (category === 'Overweight') healthScore -= 25;
    if (category === 'Obese') healthScore -= 40;
    
    // Add points for consistency (up to +20)
    healthScore += (progress.workoutConsistency / 100) * 20;
    healthScore = Math.min(100, Math.max(0, Math.round(healthScore)));

    const riskAlerts = generateRiskAlerts(medicalConditions, bmi);

    const assessment = await HealthAssessment.create({
      user: userId,
      age,
      gender,
      weightKg,
      heightCm,
      bmi: parseFloat(bmi.toFixed(2)),
      category,
      medicalConditions,
      goals,
      healthScore,
      riskAlerts
    });

    // Smart Integration: Notifications
    if (riskAlerts.length > 0) {
      await Notification.create({
        user: userId,
        type: 'Alert',
        title: 'Health Risk Detected',
        message: 'New health risks were identified based on your assessment. Please check your dashboard.',
        isRead: false
      });
    }

    res.status(201).json(assessment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAssessments = async (req, res) => {
  try {
    const assessments = await HealthAssessment.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(assessments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProgress = async (req, res) => {
  try {
    const assessments = await HealthAssessment.find({ user: req.user._id }).sort({ createdAt: 1 });
    const progress = await Progress.findOne({ user: req.user._id });

    if (!progress) return res.json({ message: 'No progress found' });

    const weightHistory = assessments.map(a => ({ date: a.createdAt, weight: a.weightKg }));
    const bmiHistory = assessments.map(a => ({ date: a.createdAt, bmi: a.bmi }));
    
    // Goal Analysis
    let completionPercentage = 0;
    let remainingTarget = 0;
    const currentWeight = weightHistory.length > 0 ? weightHistory[weightHistory.length - 1].weight : 0;
    
    if (progress.targetWeightKg && weightHistory.length > 0) {
      const startWeight = weightHistory[0].weight;
      const target = progress.targetWeightKg;
      
      const totalToLose = Math.abs(startWeight - target);
      const lostSoFar = Math.abs(startWeight - currentWeight);
      
      if (totalToLose > 0) {
        completionPercentage = Math.min(100, Math.max(0, (lostSoFar / totalToLose) * 100));
      }
      
      remainingTarget = Math.abs(currentWeight - target);
    }

    res.json({
      progress,
      weightHistory,
      bmiHistory,
      goalAnalysis: {
        completionPercentage: completionPercentage.toFixed(1),
        remainingTarget: remainingTarget.toFixed(1),
        currentWeight
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.generateReport = async (req, res) => {
  try {
    const assessments = await HealthAssessment.find({ user: req.user._id }).sort({ createdAt: -1 });
    if (assessments.length === 0) return res.status(404).json({ message: 'No data available' });

    const latest = assessments[0];
    const doc = new PDFDocument();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Health_Report.pdf');

    doc.pipe(res);
    
    doc.fontSize(25).text('Gym Pro - Health & Progress Report', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(16).text(`Date: ${new Date().toLocaleDateString()}`);
    doc.text(`Age: ${latest.age || 'N/A'} | Gender: ${latest.gender || 'N/A'}`);
    doc.moveDown();

    doc.fontSize(20).text('Current Metrics', { underline: true });
    doc.fontSize(14).text(`Weight: ${latest.weightKg} kg`);
    doc.text(`Height: ${latest.heightCm} cm`);
    doc.text(`BMI: ${latest.bmi} (${latest.category})`);
    doc.text(`Health Score: ${latest.healthScore}/100`);
    doc.moveDown();

    doc.fontSize(20).text('Risk Alerts & Safety', { underline: true });
    if (latest.riskAlerts && latest.riskAlerts.length > 0) {
      latest.riskAlerts.forEach(alert => doc.fontSize(14).text(`- ${alert}`));
    } else {
      doc.fontSize(14).text('No current risk alerts.');
    }
    
    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};