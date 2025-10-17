# Logo Upload Instructions

## How to Add Your Logo to the Header

### Step 1: Prepare Your Logo File

**Recommended Specifications:**
- **Format**: SVG (best) or PNG with transparent background
- **Size**: 40x40 pixels (square ratio preferred)
- **Colors**: Should work well on white background
- **File size**: Keep under 50KB for fast loading
- **Background**: Transparent or white

### Step 2: Save Your Logo

1. **Name your logo file**: `logo.svg` or `logo.png`
2. **Save location**: Place the file in the `public/` folder at your project root

```
Your Project/
├── public/
│   ├── logo.svg          ← Save your logo here
│   ├── favicon.ico
│   └── images/
├── app/
├── components/
└── ...
```

### Step 3: Verify the Logo

1. Start your development server: `npm run dev`
2. Visit any page with the header (homepage, services, etc.)
3. Your logo should appear in the top-left corner
4. If the logo doesn't load, the system will show a fallback droplets icon

### File Path Examples

**Correct locations:**
```
✅ public/logo.svg
✅ public/logo.png
```

**Incorrect locations:**
```
❌ public/images/logo.svg
❌ src/logo.svg
❌ components/logo.svg
```

### Troubleshooting

**Logo not showing?**
- Check the file is named exactly `logo.svg` or `logo.png`
- Verify it's in the `public/` folder (not a subfolder)
- Make sure the file isn't corrupted
- Check browser console for any loading errors

**Logo looks blurry?**
- Use SVG format for crisp display at any size
- Ensure your PNG is at least 40x40 pixels
- Avoid upscaling small images

**Logo has wrong colors?**
- Use transparent background for best results
- Avoid dark colors that won't show on the light blue background
- Test how it looks on the light blue circle background

### Fallback Behavior

If your logo file is missing or fails to load:
- The system automatically shows a droplets icon
- No errors will appear to users
- The header continues to work normally
- You can fix the logo anytime by adding the file

### Design Tips

**Best practices:**
- Keep it simple and recognizable at small sizes
- Use your brand colors
- Ensure good contrast against light backgrounds
- Consider how it looks in a circular frame

**Avoid:**
- Complex details that won't be visible at 40x40px
- Text that's too small to read
- Dark backgrounds that clash with the design

### After Uploading

Once your logo is in place:
1. ✅ The header will automatically display it
2. ✅ It appears on all pages (homepage, services, etc.)
3. ✅ Works on both desktop and mobile
4. ✅ Updates immediately without restarting the server

---

**Need help?** If your logo still isn't working, check:
1. File name is exactly `logo.svg` or `logo.png`
2. File is in the `public/` folder (not a subfolder)
3. File is not corrupted
4. Browser console for any error messages

Your logo will make the header look professional and branded! 🎨
