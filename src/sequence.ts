import { inject } from '@loopback/context';
import {
  FindRoute,
  InvokeMethod,
  ParseParams,
  Reject,
  RequestContext,
  RestBindings,
  Send,
  SequenceHandler,
  InvokeMiddleware,
} from '@loopback/rest';
import {
  AuthenticationBindings,
  AuthenticateFn,
  AUTHENTICATION_STRATEGY_NOT_FOUND,
  USER_PROFILE_NOT_FOUND,
} from '@loopback/authentication';
import { AlbLoopbackAuthBindings } from './key';
import { SequenceActionFn } from './providers/sequence';
import { UserProfile } from '@loopback/security';

const SequenceActions = RestBindings.SequenceActions;
export class AuthenticationSequence implements SequenceHandler {

  @inject(SequenceActions.INVOKE_MIDDLEWARE, { optional: true })
  protected invokeMiddleware: InvokeMiddleware = () => false;

  constructor(
    @inject(SequenceActions.FIND_ROUTE) protected findRoute: FindRoute,
    @inject(SequenceActions.PARSE_PARAMS)
    protected parseParams: ParseParams,
    @inject(SequenceActions.INVOKE_METHOD) protected invoke: InvokeMethod,
    @inject(SequenceActions.SEND) protected send: Send,
    @inject(SequenceActions.REJECT) protected reject: Reject,
    @inject(AuthenticationBindings.AUTH_ACTION)
    protected authenticateRequest: AuthenticateFn,
    @inject(AlbLoopbackAuthBindings.SEQUENCE_PROVIDER)
    protected sequenceFn: SequenceActionFn
  ) { }

  async handle(context: RequestContext) {
    try {
      const { request, response } = context;
      const finished = await this.invokeMiddleware(context);
      if (finished) return;
      const route = this.findRoute(request);
      //call authentication action
      await this.authenticateRequest(request);

      // Authentication successful, proceed to invoke controller
      const args = await this.parseParams(request, route);

      await this.sequenceFn(request, args, context);
      const result = await this.invoke(route, args);

      this.send(response, result);
    } catch (error) {
      if (
        error.code === AUTHENTICATION_STRATEGY_NOT_FOUND ||
        error.code === USER_PROFILE_NOT_FOUND
      ) {
        Object.assign(error, { statusCode: 401 /* Unauthorized */ });
      }

      this.reject(context, error);
      return;
    }
  }
}
