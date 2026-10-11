import assert from 'node:assert/strict'
import test from 'node:test'
import router from '../../src/routes/index.js'

test('shared router exposes the complete M1 authentication endpoint set', () => {
    const routes = router.stack
        .filter((layer) => layer.route)
        .map((layer) => {
            const method = Object.keys(layer.route.methods)[0].toUpperCase()
            return `${method} ${layer.route.path}`
        })

    assert.ok(routes.includes('POST /auth/signup'))
    assert.ok(routes.includes('POST /auth/login'))
    assert.ok(routes.includes('GET /auth/me'))
})
