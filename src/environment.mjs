import {
  surroundingAgent,

  Type,
  HasProperty,
  Get,
  ToBoolean,
} from './engine.mjs';

export class LexicalEnvironment {
  constructor() {
    this.EnvironmentRecord = undefined;
  }
}

export class EnvironmentRecord {
  constructor(realm) {
    this.realm = realm;
  }
}

// https://tc39.github.io/ecma262/#sec-lexical-environments
export class DeclarativeEnvironmentRecord extends EnvironmentRecord {
  constructor(realm) {
    super(realm);
    this.bindings = new Map();
  }

  HasBinding(N) {
    if (this.bindings.has(N)) {
      return true;
    }
    return false;
  }

  CreateMutableBinding(N, D) {
    this.bindings.set(N, {
      initialized: false,
      mutable: true,
      strict: undefined,
      deletable: D,
      value: undefined,
    });
  }

  CreateImmutableBinding(N, S) {
    this.bindings.set(N, {
      initialized: false,
      mutable: false,
      strict: S,
      deletable: false,
      value: undefined,
    });
  }

  InitializeBinding(N, V) {
    const binding = this.bindings.get(N);
    binding.value = V;
    binding.initialized = true;
  }

  SetMutableBinding(N, V, S) {
    const envRec = this;
    if (!this.bindings.has(N)) {
      if (S === true) {
        surroundingAgent.Throw('ReferenceError');
        envRec.CreateMutableBinding(N, true);
        envRec.InitializeBinding(N, V);
        return;
      }
    }

    const binding = this.bindings.get(N);

    if (binding.strict === true) {
      S = true;
    }

    if (binding.initialized === false) {
      surroundingAgent.Throw('ReferenceError');
    } else if (binding.mutable === true) {
      binding.value = V;
    } else if (S === true) {
      surroundingAgent.Throw('ReferenceError');
    }
  }

  GetBindingValue(N, S) {
    const binding = this.bindings.get(N);
    if (binding.initialized === false) {
      surroundingAgent.Throw('ReferenceError');
    }
    return binding.value;
  }

  DeleteBinding(N) {
    const binding = this.bindings.get(N);
    if (binding.deletable === false) {
      return false;
    }

    this.bindings.delete(N);

    return true;
  }

  HasThisBinding() {
    return false;
  }

  HasSuperBinding() {
    return false;
  }

  WithBaseObject() {
    return undefined;
  }
}

export class ObjectEnvironmentRecord extends EnvironmentRecord {
  constructor(realm, BindingObject) {
    super(realm);
    this.bindingObject = BindingObject;
    this.withEnvironment = false;
  }

  HasBinding(N) {
    const envRec = this;
    const bindings = envRec.bindingObject;

    const foundBinding = HasProperty(bindings, N);
    if (foundBinding === false) {
      return false;
    }

    if (this.withEnvironment === false) {
      return false;
    }

    const unscopables = Get(bindings, this.realm.Intrinsics.SymbolUnscopables);
    if (Type(unscopables) === 'Object') {
      const blocked = ToBoolean(Get(unscopables, N));
      if (blocked === true) {
        return false;
      }
    }

    return true;
  }
}

export class GlobalEnvironmentRecord extends EnvironmentRecord {
  constructor(realm, globalObject) {
    super(realm);
    this.ObjectRecord = new ObjectEnvironmentRecord(this.realm, globalObject);
    this.GlobalThisValue = globalObject;
    this.DeclarativeRecord = new DeclarativeEnvironmentRecord(this.realm);
    this.VarNames = [];
  }
}
