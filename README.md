# IPL Predictor Challenge

An interactive application to relive classic IPL matches and test your cricket instincts!

## Environment Configuration

This application uses environment variables for configuration:

- `VITE_APP_MODE`: Set to 'test' to use mock data, or any other value to use real API data

Copy the `.env.example` file to create your own `.env` file:

```bash
cp .env.example .env
```

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
