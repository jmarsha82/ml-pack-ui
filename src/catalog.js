// This registry drives navigation, form labels, algorithm choices, and task descriptions.
// Keeping it data-only makes adding a new mlpack workflow a small, testable change.
export const groups = [
  // Data-preparation tasks transform raw tables before model training.
  { name: 'Prepare data', tasks: [
    { id:'clean', name:'Clean & normalize', icon:'SlidersHorizontal', description:'Impute, scale, normalize, and encode a dataset.', algorithms:['Standardize','Min-max scale','Mean imputation'], fields:['Dataset','Columns','Transform'] },
    { id:'split', name:'Split datasets', icon:'Split', description:'Create reproducible train, validation, and test partitions.', algorithms:['Random split','Stratified split'], fields:['Dataset','Train ratio','Random seed'] },
  ]},
  // Supervised tasks learn a target from labeled examples.
  { name: 'Supervised', tasks: [
    { id:'classification', name:'Classification', icon:'Binary', description:'Predict a discrete label and inspect class probabilities.', algorithms:['Random Forest','Logistic Regression','Decision Tree','Naive Bayes','AdaBoost','Linear SVM'], fields:['Training CSV','Target column','Train / test split','Random seed'] },
    { id:'regression', name:'Regression', icon:'TrendingUp', description:'Predict continuous values and analyze residuals.', algorithms:['Linear Regression','Random Forest','LARS','Decision Tree'], fields:['Training CSV','Target column','Test split','Regularization'] },
    { id:'nearest', name:'Nearest neighbors', icon:'LocateFixed', description:'Search for the closest rows, labels, or vectors.', algorithms:['KNN Classification','Exact Neighbor Search','Approximate Search'], fields:['Reference data','Query vector','Neighbors (k)','Distance metric'] },
  ]},
  // Unsupervised tasks discover structure without known labels.
  { name: 'Unsupervised', tasks: [
    { id:'clustering', name:'Clustering', icon:'Orbit', description:'Discover natural groups without labeled examples.', algorithms:['K-Means','DBSCAN','Mean Shift','Gaussian Mixture'], fields:['Dataset','Clusters (k)','Max iterations','Distance metric'] },
    { id:'dimensionality', name:'Dimensionality reduction', icon:'Shrink', description:'Compress high-dimensional data for insight or modeling.', algorithms:['PCA','Kernel PCA','NMF','Randomized SVD'], fields:['Dataset','Output dimensions','Variance retained','Center data'] },
    { id:'anomaly', name:'Anomaly detection', icon:'ScanSearch', description:'Rank unusual observations and potential outliers.', algorithms:['Local Outlier Factor','Isolation Forest approximation','KNN distance'], fields:['Dataset','Neighbors','Contamination','Score threshold'] },
  ]},
  // Exploration tasks summarize data or derive recommendations and temporal features.
  { name: 'Explore', tasks: [
    { id:'statistics', name:'Statistics', icon:'ChartNoAxesCombined', description:'Profile distributions, correlations, and feature quality.', algorithms:['Summary Statistics','Correlation Matrix','Information Gain'], fields:['Dataset','Columns','Group by','Missing policy'] },
    { id:'recommendation', name:'Recommendations', icon:'Sparkles', description:'Learn user-item preferences from interaction data.', algorithms:['Collaborative Filtering','NMF Recommender','SVD Recommender'], fields:['Interactions CSV','User ID','Item ID','Recommendations'] },
    { id:'timeseries', name:'Time-series features', icon:'Activity', description:'Turn ordered signals into windows for forecasting models.', algorithms:['Lag Features','Rolling Statistics','Regression Forecast'], fields:['Time-series CSV','Time column','Value column','Forecast horizon'] },
  ]},
  // Final-stage tasks evaluate trained models and run production-style scoring.
  { name: 'Evaluate & use', tasks: [
    { id:'evaluate', name:'Model evaluation', icon:'Gauge', description:'Compare models with cross-validation and useful metrics.', algorithms:['K-Fold Validation','Holdout Validation','Confusion Matrix'], fields:['Dataset','Saved model','Folds','Primary metric'] },
    { id:'predict', name:'Run predictions', icon:'Play', description:'Load a saved mlpack model and score new observations.', algorithms:['Classify','Regress','Batch score'], fields:['Model file','Input CSV','Output path','Include probabilities'] },
  ]},
];

// Flatten grouped navigation for direct id lookup and future search filtering.
export const allTasks = groups.flatMap(group => group.tasks);
// Unknown ids fall back to classification so stale links never blank the application.
export const taskById = id => allTasks.find(task => task.id === id) || allTasks[2];

// Deterministic sample rows keep offline/demo output predictable and easy to test.
export const sampleRows = [
  { id:1, actual:'setosa', predicted:'setosa', confidence:.97 },
  { id:2, actual:'versicolor', predicted:'versicolor', confidence:.88 },
  { id:3, actual:'virginica', predicted:'virginica', confidence:.93 },
  { id:4, actual:'versicolor', predicted:'setosa', confidence:.61 },
  { id:5, actual:'setosa', predicted:'setosa', confidence:.95 },
];

export function buildDemoResult(task, algorithm) {
  // Clustering requires unsupervised metrics instead of accuracy and recall.
  const clustering = task.id === 'clustering';
  // Match the native API shape so the Results component needs no special demo branch.
  return {
    // Echo the selected algorithm in the result heading.
    title: `${algorithm} results`,
    // Choose metrics whose meaning fits the workflow family.
    metrics: clustering ? [['Silhouette','0.731'],['Clusters','3'],['Iterations','14'],['Inertia','78.4']] : [['Accuracy','94.2%'],['Precision','93.8%'],['Recall','94.5%'],['F1 score','94.1%']],
    // Reuse stable row-level predictions for the output table.
    rows: sampleRows,
    // Expose the approximate C++ call in the activity console for educational value.
    log: `mlpack::${task.id}::${algorithm.replaceAll(' ','')}().Train(dataset);`,
    // Mark this payload so the UI never misrepresents demo values as native results.
    demo: true,
  };
}

/** Convert a browser File size into a short value suitable for the upload status UI. */
export function formatFileSize(bytes) {
  // Keep tiny files readable instead of displaying a misleading decimal kilobyte value.
  if (bytes < 1024) return `${bytes} B`;
  // CSV datasets in this workbench are normally best described in KB or MB.
  const kilobytes = bytes / 1024;
  if (kilobytes < 1024) return `${kilobytes.toFixed(1)} KB`;
  return `${(kilobytes / 1024).toFixed(1)} MB`;
}

/** Return a user-facing validation error, or null when a selected CSV can be loaded. */
export function validateCsvFile(file) {
  if (!file) return 'No file was selected. Please choose a CSV file.';
  if (!file.name.toLowerCase().endsWith('.csv')) return 'Unsupported file type. Please choose a .csv file.';
  if (file.size === 0) return 'The selected CSV is empty.';
  if (file.size > 50 * 1024 * 1024) return 'The selected CSV is larger than the 50 MB limit.';
  return null;
}
