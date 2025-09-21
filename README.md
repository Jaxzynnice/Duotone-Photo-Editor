# Duotone Photo Editor

A modern web application that allows users to upload photos and apply beautiful duotone effects (Brave Pink, Hero Green, or a combination of both). All processing happens locally in the browser for maximum privacy.

## Features

- Upload images in JPG, JPEG, PNG, WebP, ICO, HEIC, GIF, BMP, and TIFF formats
- No file size limit - all processing happens client-side
- Three duotone effects: Brave Pink, Hero Green, and Combined
- Swipe functionality to switch between effects
- Adjustable effect intensity with slider and numeric input
- Classic colors mode for color-blind friendly experience
- Reverse color option for different visual effects
- Light/dark mode toggle
- English/Indonesian language support
- Undo/redo functionality (up to 3 steps)
- Multiple export formats: PNG, JPEG, WebP, ICO, BMP, GIF, TIFF
- Download edited images
- Share images using the Web Share API
- Color code sections with copy functionality
- FAQ section
- Privacy policy and terms of service
- Feedback form with WhatsApp integration
- Fully responsive design for all devices
- Modern, clean UI with smooth animations

## Technical Details

- Built with vanilla HTML, CSS, and JavaScript
- Uses Canvas API for image processing
- No server-side processing - everything happens in the browser
- Responsive design using CSS Grid and Flexbox
- Web Share API for sharing functionality
- Touch and mouse events for swipe functionality
- LocalStorage for user preferences
- Optimized performance with requestAnimationFrame
- WhatsApp integration for feedback

## Browser Compatibility

This application works in all modern browsers that support:
- HTML5 Canvas
- ES6+ JavaScript features
- CSS Grid and Flexbox
- Web Share API (for sharing functionality)

## File Structure

```

duotone-photo-editor/
├── index.html          # Main HTML file
├── css/
│   └── style.css       # All styles for the application
├── js/
│   └── script.js       # Application logic and functionality
├── images/             # Directory for images and icons
│   ├── favicon.ico     # Website favicon
│   ├── logo.png        # Application logo
│   ├── jaxzynnice.png  # Developer logo
│   └── deepseek.png    # DeepSeek logo
├── sitemap.xml         # XML sitemap for SEO
└── README.md           # This file

```


## Deployment

This application can be deployed to any static hosting service like:
- Netlify
- Vercel
- GitHub Pages
- Firebase Hosting

Simply upload all files to your hosting provider.

### SEO Optimization

The application includes:
- Meta tags for SEO and social media sharing
- Open Graph tags for Facebook
- Twitter Card tags for Twitter
- Structured data (JSON-LD) for search engines
- XML sitemap
- Google Tag Manager integration
- Microsoft Clarity analytics

## Privacy

All image processing happens locally in your browser. No images are uploaded to any server, ensuring complete privacy for your photos.

## Feedback System

The feedback form integrates with WhatsApp to send messages directly to the developer. When users submit feedback:
1. The form data is captured
2. A pre-formatted message is created
3. WhatsApp opens with the message ready to send
4. Users need to manually press send to complete the process

This approach maintains privacy while allowing direct communication with the developer.

## Language Support

The application supports both English and Indonesian languages with a toggle switch. All text elements are translated, including:
- UI labels and buttons
- Section titles and content
- FAQ questions and answers
- Privacy policy and terms
- Feedback form

## License

This project is open source and available under the MIT License.

## Developer

Created with ❤️ by [Jaxzynnice](https://wa.me/6283872050439)

- Website: https://jaxzynnice.zone.id
- Instagram: https://instagram.com/janukiwill
- WhatsApp: https://wa.me/6283872050439

## Acknowledgments

- Icons by Font Awesome
- Google Fonts for typography
- DeepSeek for collaboration
- All users who provide feedback to improve the application