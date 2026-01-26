import { createServer } from 'vite';

(async () => {
    try {
        const server = await createServer({
            // Use existing config settings
            configFile: './vite.config.ts',
            server: {
                port: 5173,
                strictPort: true, // Fail if port is in use
            }
        });

        await server.listen();

        const info = server.config.server;
        console.log(`\n  Vite server running at:\n`);
        console.log(`  > Local: http://localhost:${info.port}/\n`);

        // Keep process alive
        await new Promise(() => { });
    } catch (e) {
        console.error('Failed to start server:', e);
        process.exit(1);
    }
})();
