import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Unmount and clear the DOM after every test so leaked timers / sockets from
// one case can never bleed into the next (this is also what surfaces the
// "no state update after unmount" guarantee in the cleanup test).
afterEach(() => {
  cleanup()
})
