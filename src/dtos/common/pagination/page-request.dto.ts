import type { SortDirection } from '../../../enums/common/sort-direction.enum'

export interface PageRequestDto<TSortField extends string = string> {
  page: number
  pageSize: number
  sortBy: TSortField
  sortDirection: SortDirection
}
