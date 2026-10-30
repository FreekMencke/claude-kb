git init -q .
cat > package.json <<'J'
{ "name": "shop-api", "version": "1.0.0", "type": "module", "scripts": { "test": "vitest run", "verify": "tsc && vitest run" }, "dependencies": { "express": "^4.21.0" }, "devDependencies": { "typescript": "~6.0.2", "vitest": "^4.0.0" } }
J
mkdir -p src
printf "export const add = (a: number, b: number) => a + b;\n" > src/add.ts
git add -A; git -c user.name=t -c user.email=t@example.com commit -qm init
