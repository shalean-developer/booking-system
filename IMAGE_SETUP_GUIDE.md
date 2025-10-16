# 📸 Image Setup Guide for Shalean Cleaning Homepage

## 🎯 Required Images & Dimensions

### 1. Hero Section - Main Team Photo
- **Location**: `/public/images/professional-cleaning-team.jpg`
- **Size**: 1200x800px (3:2 aspect ratio)
- **Format**: JPG or WebP
- **Usage**: Main hero image in the services section

### 2. Service Cards (3 images needed)
- **Home Maintenance**: `/public/images/home-maintenance.jpg`
- **Deep Specialty**: `/public/images/deep-specialty.jpg`  
- **Move Turnover**: `/public/images/move-turnover.jpg`
- **Size**: 800x600px (4:3 aspect ratio)
- **Format**: JPG or WebP

### 3. Team Photos (3 images needed)
- **Sarah Johnson**: `/public/images/team-sarah-johnson.jpg`
- **Mike Chen**: `/public/images/team-mike-chen.jpg`
- **Emma Rodriguez**: `/public/images/team-emma-rodriguez.jpg`
- **Size**: 400x400px (square, for profile photos)
- **Format**: JPG or PNG with good lighting

## 📁 File Structure
```
public/
├── images/
│   ├── professional-cleaning-team.jpg    # Main hero image
│   ├── home-maintenance.jpg              # Service card 1
│   ├── deep-specialty.jpg                # Service card 2
│   ├── move-turnover.jpg                 # Service card 3
│   ├── team-sarah-johnson.jpg           # Team member 1
│   ├── team-mike-chen.jpg               # Team member 2
│   └── team-emma-rodriguez.jpg          # Team member 3
```

## 🛠️ How to Add Images

1. **Prepare your images** in the correct sizes
2. **Place them** in the `public/images/` directory
3. **Update the code** to reference the correct image paths

## ⚡ Next.js Image Optimization Tips

- Use Next.js `Image` component for automatic optimization
- Include proper `alt` text for accessibility
- Use `priority` prop for above-the-fold images
- Consider using `placeholder="blur"` for better loading experience
