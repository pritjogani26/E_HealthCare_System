from typing import List


class Solution:
    def singleNumber(self, nums: List[int]) -> int:
        res = 0
        for num in nums:
            res = res ^ num
            print(res)
        return res
    
s = Solution()

print(s.singleNumber([2,4,2,5,8,4,5]))