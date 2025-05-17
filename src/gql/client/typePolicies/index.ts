// import { Scalars } from 'src/modules/gql/generated'
// import { TypedTypePolicies } from 'src/modules/gql/generated/helpers/apollo-helpers'

import { Scalars } from '../../generated'
import { TypedTypePolicies } from '../../generated/helpers/apollo-helpers'

const DateTime = (
  v: string | null | undefined,
): Scalars['DateTime']['output'] | null | undefined => {
  return typeof v === 'string' ? new Date(v) : v
}

export const typePolicies: TypedTypePolicies = {
  Message: {
    fields: {
      createdAt: DateTime,
      updatedAt: DateTime,
    },
  },
}
