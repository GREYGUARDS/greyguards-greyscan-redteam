# Greyguards WordPress Integration

This WordPress theme replicates the design system from your Greyguards React app, allowing you to create a professional website that can host or link to your application.

## Installation

### Option 1: Custom Theme (Recommended)

1. **Create theme folder**:
   - Copy all these files to: `/wp-content/themes/greyguards/`
   
2. **Required files structure**:
   ```
   /wp-content/themes/greyguards/
   ├── style.css
   ├── functions.php
   ├── header.php
   ├── footer.php
   ├── page-app-embed.php
   ├── index.php (create a basic one)
   └── screenshot.png (optional theme thumbnail)
   ```

3. **Activate the theme**:
   - Go to WordPress Admin → Appearance → Themes
   - Activate "Greyguards Intelligence"

### Option 2: Add to Existing Theme

If you want to keep your current theme and just add the styling:

1. **Add CSS to your theme**:
   - Go to Appearance → Customize → Additional CSS
   - Paste the contents of `style.css`

2. **Add shortcode to functions.php**:
   - Go to Appearance → Theme File Editor
   - Add the shortcode function from `functions.php`

## Usage

### Embedding Your React App

#### Method 1: Using Shortcode (Easiest)

Add this shortcode to any page or post:

```
[greyguards_app url="https://your-app-url.lovable.app" height="800px"]
```

#### Method 2: Using Custom Page Template

1. Create a new page in WordPress
2. Select "App Embed Page" as the template
3. Add your app URL using a custom field named `app_url`
4. Publish the page

#### Method 3: Direct iframe (In page editor)

Add this HTML to your page in the HTML editor:

```html
<div class="app-embed">
  <iframe 
    src="https://your-app-url.lovable.app" 
    title="Greyguards Intelligence Dashboard"
    style="min-height: 800px;"
    loading="lazy"
    allowfullscreen>
  </iframe>
</div>
```

### Publishing Your React App

Before embedding, publish your Lovable app:

1. In Lovable, click **Publish** (top right)
2. Copy the published URL (e.g., `https://your-project.lovable.app`)
3. Use this URL in the WordPress embed methods above

### Linking Instead of Embedding

If you prefer to link to your app rather than embed it:

```html
<a href="https://your-app-url.lovable.app" class="btn btn-primary">
  Launch Intelligence Dashboard
</a>
```

## Customization

### Changing Colors

Edit the CSS variables in `style.css` (lines 11-32):

```css
:root {
  --primary: hsl(210, 12%, 48%); /* Change primary color */
  --success: hsl(145, 20%, 52%); /* Change success color */
  /* ... etc */
}
```

### Adding Navigation Menu

1. Go to Appearance → Menus
2. Create a new menu
3. Add pages/links
4. Assign to "Primary Menu" location

### Custom Page Layouts

Use the provided CSS classes:

```html
<!-- Two column grid -->
<div class="grid grid-2">
  <div class="card">
    <h2 class="card-title">Card Title</h2>
    <div class="card-content">Content here</div>
  </div>
  <div class="card">
    <h2 class="card-title">Card Title</h2>
    <div class="card-content">Content here</div>
  </div>
</div>

<!-- Buttons -->
<a href="#" class="btn btn-primary">Primary Button</a>
<a href="#" class="btn btn-outline">Outline Button</a>

<!-- Badges -->
<span class="badge badge-success">Active</span>
<span class="badge badge-warning">Warning</span>
<span class="badge badge-danger">Critical</span>
```

## Important Notes

### Cross-Origin Restrictions

If your app has authentication or uses cookies, you may need to:

1. **Configure CORS** in your React app
2. **Use SameSite cookies** if sharing sessions
3. **Consider linking instead** of embedding for full functionality

### Performance Optimization

1. **Lazy loading**: The iframe uses `loading="lazy"` by default
2. **Caching**: Consider using a caching plugin (WP Super Cache, W3 Total Cache)
3. **CDN**: Use a CDN for static assets

### Mobile Responsiveness

The theme is fully responsive. Test on mobile devices to ensure the iframe scales properly.

## Hosting Options

### Where to Host Your WordPress Site

1. **WordPress.com** (Easiest, requires Business plan for custom themes)
2. **Shared Hosting** (Bluehost, SiteGround, HostGator)
3. **VPS/Cloud** (DigitalOcean, Linode, Vultr)
4. **Managed WordPress** (WP Engine, Kinsta, Flywheel)

### Recommended Setup

1. WordPress site for marketing/landing pages
2. Embedded React app for the intelligence dashboard
3. Custom domain for both (e.g., www.yourdomain.com → WordPress, app.yourdomain.com → React app)

## Troubleshooting

### App not loading in iframe

- Check browser console for CORS errors
- Verify the app URL is correct and published
- Try linking instead of embedding

### Styling issues

- Clear WordPress cache
- Check for CSS conflicts with other plugins
- Use browser dev tools to inspect elements

### Mobile display problems

- Test iframe height on different devices
- Consider using a responsive embed plugin
- Add custom mobile styles if needed

## Support

For React app issues: Check your Lovable project
For WordPress issues: Check WordPress documentation or theme support

## License

This theme is provided as-is for integration with your Greyguards project.
