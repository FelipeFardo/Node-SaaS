// import { env } from '@/env'
// import type { FastifyInstance } from 'fastify'
// import { ZodTypeProvider } from 'fastify-type-provider-zod'
// import z from 'zod'

// import { accounts, db, users } from '@/db/connection'

// import { BadRequestError } from '../_errors/bad-request-error'

// export async function authenticateWithGithub(app: FastifyInstance) {
//   app.withTypeProvider<ZodTypeProvider>().post(
//     '/sessions/github',
//     {
//       schema: {
//         tags: ['auth'],
//         summary: 'Authenticate with Github',
//         body: z.object({
//           code: z.string(),
//         }),
//         response: {
//           201: z.object({
//             token: z.string(),
//           }),
//         },
//       },
//     },
//     async (request, reply) => {
//       const { code } = request.body

//       const githubOAuthUrl = new URL(
//         `https://github.com/login/oauth/access_token`,
//       )

//       githubOAuthUrl.searchParams.set('client_id', env.GITHUB_OAUTH_CLIENT_ID)
//       githubOAuthUrl.searchParams.set(
//         'client_secret',
//         env.GITHUB_OAUTH_CLIENT_SECRET,
//       )
//       githubOAuthUrl.searchParams.set(
//         'redirect_uri',
//         env.GITHUB_OAUTH_CLIENT_REDIRECT_URI,
//       )
//       githubOAuthUrl.searchParams.set('code', code)

//       const githubAccessTokenResponse = await fetch(githubOAuthUrl, {
//         method: 'POST',
//         headers: {
//           Accept: 'application/json',
//         },
//       })

//       const githubAccessTokenData = await githubAccessTokenResponse.json()

//       const { access_token: githubAccessToken } = z
//         .object({
//           access_token: z.string(),
//           token_type: z.literal('bearer'),
//           scope: z.string(),
//         })
//         .parse(githubAccessTokenData)

//       const githubUserResponse = await fetch('https://api.github.com/user', {
//         headers: {
//           Authorization: `Bearer ${githubAccessToken}`,
//         },
//       })

//       const githubUserData = await githubUserResponse.json()

//       const {
//         id: githubId,
//         name,
//         email,
//         avatar_url: avatarKey,
//       } = z
//         .object({
//           id: z.number().int().transform(String),
//           avatar_url: z.string().url(),
//           name: z.string().nullable(),
//           email: z.string().nullable(),
//         })
//         .parse(githubUserData)

//       if (email === null) {
//         throw new BadRequestError(
//           'Your Github account must have to authenticate',
//         )
//       }

//       let user = await db.query.users.findFirst({
//         where(fields, { eq }) {
//           return eq(fields.email, email)
//         },
//       })

//       if (!user) {
//         const [userCreated] = await db
//           .insert(users)
//           .values({
//             name,
//             email,
//             avatarKey,
//           })
//           .returning()
//         user = userCreated
//       }

//       let account = await db.query.accounts.findFirst({
//         where(fields, { and, eq }) {
//           return and(eq(fields.provider, 'GITHUB'), eq(fields.userId, user.id))
//         },
//       })

//       if (!account) {
//         const result = await db
//           .insert(accounts)
//           .values({
//             provider: 'GITHUB',
//             providerAccountId: githubId,
//             userId: user.id,
//           })
//           .returning()

//         account = result[0]
//       }

//       const token = await reply.jwtSign(
//         {
//           sub: user!.id,
//         },
//         {
//           sign: {
//             expiresIn: '7d',
//           },
//         },
//       )
//       return reply.status(201).send({ token })
//     },
//   )
// }
