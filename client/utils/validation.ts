
// Form validation utilities

export interface ValidationResult {
  isValid: boolean;
  errors: { [key: string]: string };
}

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

// Password validation
export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  
  return { isValid: true };
};

// Name validation
export const validateName = (name: string): boolean => {
  return name.trim().length >= 2;
};

// Age validation
export const validateAge = (age: number): boolean => {
  return age >= 13 && age <= 120;
};

// Login form validation
export const validateLoginForm = (email: string, password: string): ValidationResult => {
  const errors: { [key: string]: string } = {};
  
  if (!email.trim()) {
    errors.email = 'Email is required';
  } else if (!validateEmail(email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  if (!password.trim()) {
    errors.password = 'Password is required';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Signup form validation
export const validateSignupForm = (formData: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  age: string;
  gender: string;
  country: string;
  city: string;
  role: string;
}): ValidationResult => {
  const errors: { [key: string]: string } = {};
  
  // Name validation
  if (!formData.name.trim()) {
    errors.name = 'Name is required';
  } else if (!validateName(formData.name)) {
    errors.name = 'Name must be at least 2 characters long';
  }
  
  // Email validation
  if (!formData.email.trim()) {
    errors.email = 'Email is required';
  } else if (!validateEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  // Password validation
  if (!formData.password) {
    errors.password = 'Password is required'; 
  } else {
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.message || 'Invalid password';
    }
  }
  
  // Confirm password validation
  if (!formData.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }
  
  // Age validation
  const age = parseInt(formData.age);
  if (!formData.age) {
    errors.age = 'Age is required';
  } else if (isNaN(age) || !validateAge(age)) {
    errors.age = 'Age must be between 13 and 120';
  }
  
  // Gender validation
  if (!formData.gender) {
    errors.gender = 'Gender is required';
  }
  
  // Country validation
  if (!formData.country.trim()) {
    errors.country = 'Country is required';
  }
  
  // City validation
  if (!formData.city.trim()) {
    errors.city = 'City is required';
  }
  
  // Role validation
  if (!formData.role) {
    errors.role = 'Account type is required';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Shop creation validation
export const validateShopForm = (formData: {
  name: string;
  logo: string;
  location: string;
  country: string;
  city: string;
  category: string;
}): ValidationResult => {
  const errors: { [key: string]: string } = {};
  
  if (!formData.name.trim()) {
    errors.name = 'Shop name is required';
  } else if (formData.name.trim().length < 3) {
    errors.name = 'Shop name must be at least 3 characters long';
  }
  
  if (!formData.logo) {
    errors.logo = 'Shop logo is required';
  }
  
  if (!formData.location.trim()) {
    errors.location = 'Location is required';
  }
  
  if (!formData.country) {
    errors.country = 'Country is required';
  }
  
  if (!formData.city.trim()) {
    errors.city = 'City is required';
  }
  
  if (!formData.category) {
    errors.category = 'Category is required';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Roll upload validation
export const validateReelUpload = (formData: {
  videoUri: string;
  caption: string;
  category: string;
}): ValidationResult => {
  const errors: { [key: string]: string } = {};
  
  if (!formData.videoUri) {
    errors.video = 'Please select a video';
  }
  
  if (!formData.caption.trim()) {
    errors.caption = 'Caption is required';
  } else if (formData.caption.trim().length < 10) {
    errors.caption = 'Caption must be at least 10 characters long';
  }
  
  if (!formData.category) {
    errors.category = 'Category is required';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Comment validation
export const validateComment = (comment: string): boolean => {
  return comment.trim().length >= 1 && comment.trim().length <= 500;
};
