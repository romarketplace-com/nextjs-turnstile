# Next.js Turnstile CAPTCHA Package
![npm](https://img.shields.io/npm/v/nextjs-turnstile)
![License](https://img.shields.io/npm/l/nextjs-turnstile)
![npm](https://img.shields.io/npm/dw/nextjs-turnstile)

This package provides components and utilities to integrate Cloudflare Turnstile CAPTCHA into your Next.js applications. It supports both implicit and explicit CAPTCHA modes.

You can find the document of Cloudflare Turnstile [here](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/).

## Installation

```bash
npm install nextjs-turnstile
```

## Usage

### Components
**TurnstileImplicit:**
- Note: The `onSuccess`, `onError`, and `onExpire` props are optional.

```javascript
import React from 'react';
import { TurnstileImplicit, verifyTurnstile } from 'nextjs-turnstile';

export default function MyForm() {
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token1 = e.target['cf-turnstile-response-1'].value;
    const token2 = e.target['cf-turnstile-response-2'].value;

    // Verify the first CAPTCHA response
    const success1 = await verifyTurnstile(token1);
    if (!success1) {
      alert('First CAPTCHA verification failed');
      return;
    }

    // Verify the second CAPTCHA response
    const success2 = await verifyTurnstile(token2);
    if (!success2) {
      alert('Second CAPTCHA verification failed');
      return;
    }
  };

  const handleSuccess = (token) => {
    console.log('Captcha success:', token);
    // Handle successful captcha verification, e.g., submit the form
  };

  const handleError = () => {
    console.error('Captcha error occurred');
    setAlerts((prev) => [
      ...prev,
      { type: 'danger', message: 'Captcha verification failed. Please try again.' },
    ]);
  };

  const handleExpire = () => {
    console.warn('Captcha expired');
    setAlerts((prev) => [
      ...prev,
      { type: 'warning', message: 'Captcha expired. Please complete it again.' },
    ]);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Turnstile Implicit CAPTCHA Example</h2>
      
      {/* First CAPTCHA */}
      <TurnstileImplicit
        theme="dark"
        size="normal"
        responseFieldName="cf-turnstile-response-1"
        onSuccess={handleSuccess}
        onError={handleError}
        onExpire={handleExpire}
      />
      
      {/* Second CAPTCHA */}
      <TurnstileImplicit
        theme="light"
        size="compact"
        responseFieldName="cf-turnstile-response-2"
        onError={handleError}
      />
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

**TurnstileExplicit:**
- Note: Developers must place the divs in their HTML and pass the id of the div to the `responseFieldName` prop.
- Note: The `onSuccess`, `onError`, and `onExpire` props are optional.
```javascript
import React from 'react';
import { TurnstileExplicit, verifyTurnstile } from 'nextjs-turnstile';

export default function MyForm() {
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token1 = e.target['cf-turnstile-response-3'].value;
    const token2 = e.target['cf-turnstile-response-4'].value;
    
    // Verify the first CAPTCHA response
    const success1 = await verifyTurnstile(token1);
    if (!success1) {
      alert('First CAPTCHA verification failed');
      return;
    }

    // Verify the second CAPTCHA response
    const success2 = await verifyTurnstile(token2);
    if (!success2) {
      alert('Second CAPTCHA verification failed');
      return;
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Turnstile Explicit CAPTCHA Example</h2>

      {/* Developers must place the divs in their HTML */}
      
      {/* First CAPTCHA */}
      <div id="cf-turnstile-response-3"></div>
      <TurnstileExplicit
        theme="dark"
        size="normal"
        responseFieldName="cf-turnstile-response-3"
        onSuccess={(token) => console.log(token)}
        onError={(error) => console.error(error)}
        onExpire={() => console.log('CAPTCHA expired')}
      />
      
      {/* Second CAPTCHA */}
      <div id="cf-turnstile-response-4"></div>
      <TurnstileExplicit
        theme="light"
        size="compact"
        responseFieldName="cf-turnstile-response-4"
      />
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Verification Utility
In your API routes:

```javascript
import { verifyTurnstile } from 'nextjs-turnstile';

export default async function handler(req, res) {
  const { token } = req.body;

  const success = await verifyTurnstile(token);
  // Passing IP directly:
  // const success = await verifyTurnstile(token, req.connection.remoteAddress);

  if (success) {
    return res.status(200).json({ success: true });
  } else {
    return res.status(400).json({ success: false, message: 'CAPTCHA verification failed' });
  }
}
```

### Function API

Here's a breakdown of the functions available in `nextjs-turnstile`.

#### Server-side

##### `verifyTurnstile(token, options?)`

Verifies a Cloudflare Turnstile token from your server-side code (e.g., API routes, Server Actions).

-   `token` (string, required): The `cf-turnstile-response` value from the form.
-   `options` (object, optional):
    -   `secretKey` (string): Your Turnstile secret key. Defaults to the `TURNSTILE_SECRET_KEY` environment variable.
    -   `ip` (string): The user's IP address. The function attempts to automatically determine this from request headers, but you can provide it manually.
    -   `headers` (Headers | object): When calling from a context without access to `next/headers` (like Pages Router API routes), you can pass the request headers to help with IP address detection.

**Returns:** A `Promise<boolean>` that resolves to `true` if the token is valid, and `false` otherwise.

**Example:**

```javascript
import { verifyTurnstile } from 'nextjs-turnstile';

export async function POST(request: Request) {
  const { token } = await request.json();
  const success = await verifyTurnstile(token);

  if (success) {
    return new Response('Success!', { status: 200 });
  }
  return new Response('Captcha failed', { status: 400 });
}
```

#### Client-side

These utility functions can be used in your React components to interact with the Turnstile widget. They can be safely imported in any environment and will not cause issues during server-side rendering.

-   `loadTurnstileScript(mode?)`: Dynamically loads the Turnstile script. `mode` can be `'implicit'` (default) or `'explicit'`. Returns a promise that resolves when the script is loaded.
-   `isTurnstileLoaded()`: Returns `true` if the Turnstile script has been loaded and the `window.turnstile` object is available.
-   `resetTurnstile(widget?)`: Resets a Turnstile widget, allowing the user to solve it again. The `widget` parameter can be the widget's ID, or you can leave it empty to reset all widgets on the page.
-   `executeTurnstile(widget)`: Programmatically runs the challenge for a given widget.
-   `getTurnstileResponse(widget)`: Retrieves the current response token for a specific widget.
-   `removeTurnstile(widget)`: Removes a widget and its associated elements from the DOM.

## Environment Variables
You need to add the following environment variables to your .env.local file:

```plaintext
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key_here
TURNSTILE_SECRET_KEY=your_secret_key_here
```

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release history and notable changes.

## Contributing

Contributions, issues, and feature requests are welcome! Please open an issue or pull request on [GitHub](https://github.com/davodm/nextjs-turnstile).

### Development
- Clone the repo and run `npm install`.
- Run `npm test` to execute tests.
- Run `npm run build` to build the package.
- Lint with `npm run lint` (if ESLint config is present).

## License
This project is licensed under the MIT License - see the [License](./LICENSE) file for details.


## Author
Davod Mozafari - [Twitter](https://twitter.com/davodmozafari)
