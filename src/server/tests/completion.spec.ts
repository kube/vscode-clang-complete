
      /*#######.
     ########",#:
   #########',##".
  ##'##'## .##',##.
   ## ## ## # ##",#.
    ## ## ## ## ##'
     ## ## ## :##
      ## ## ##*/

import { getCompletion } from '../completion'

describe('getCompletion', () => {
  const source = `
    typedef struct {
      int a;
      void* b;
      char* c;
    } hello_t;

    int main() {
      hello_t* hello;

      hello->
    }
  `
  const completionPromise = getCompletion('c', source, {
    line: 10,
    character: 13
  })

  it('returns correct number of properties', async () => {
    const completion = await completionPromise
    expect(Array.isArray(completion)).toBe(true)
    expect(completion.length).toBe(3)
  })

  it('returns correct labels', async () => {
    const completion = await completionPromise
    expect(completion.map(_ => _.label)).toEqual(['a', 'b', 'c'])
  })
})
